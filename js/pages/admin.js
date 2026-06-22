/* SDMIS — Admin: configure zones & officials */
window.SDMIS = window.SDMIS || {};

SDMIS.router.register('admin', {
  roles: ['admin'],
  title: 'Configuration',
  render: function ($c, params) {
    var store = SDMIS.store, ui = SDMIS.ui, C = SDMIS.constants;
    var TAB_LABELS = { surveys: 'Surveys', zones: 'Zones', officials: 'Officials', masters: 'Masters' };
    var tab = (params && params[0] && TAB_LABELS[params[0]]) ? params[0] : 'surveys';
    var masterSub = (C.masterKeys[0] || {}).key;

    function counts() {
      return {
        surveys: store.all('surveys').length,
        zones: store.all('zones').length,
        inspectors: store.where('officials', function (o) { return o.role === 'inspector'; }).length,
        swos: store.where('officials', function (o) { return o.role === 'swo'; }).length,
        records: store.all('beneficiaries').length
      };
    }

    function zoneName(id) { var z = store.find('zones', id); return z ? z.name + ' (' + z.code + ')' : '—'; }

    function shellHtml() {
      var k = counts();
      return '' +
        '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">' +
          statCard('Zones', k.zones, 'bg-indigo-50 text-indigo-700') +
          statCard('Inspectors', k.inspectors, 'bg-emerald-50 text-emerald-700') +
          statCard('SWOs', k.swos, 'bg-amber-50 text-amber-700') +
          statCard('Beneficiary Records', k.records, 'bg-rose-50 text-rose-700') +
        '</div>' +
        '<div class="bg-white rounded-xl shadow-sm border">' +
          '<div class="border-b px-4 flex gap-1">' +
            tabBtn('zones', 'Zones') + tabBtn('officials', 'Officials') +
          '</div>' +
          '<div id="admin-body" class="p-4"></div>' +
        '</div>';
    }

    function statCard(label, val, cls) {
      return '<div class="bg-white rounded-xl border shadow-sm p-4">' +
        '<div class="text-2xl font-bold text-slate-800">' + val + '</div>' +
        '<div class="text-xs ' + cls + ' inline-block px-2 py-0.5 rounded mt-1">' + label + '</div></div>';
    }
    function tabBtn(id, label) {
      return '<button class="admin-tab px-4 py-2.5 text-sm font-medium border-b-2 ' +
        (tab === id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700') +
        '" data-tab="' + id + '">' + label + '</button>';
    }

    // ---------- ZONES ----------
    var zonePage = 1, PER = 10;
    function renderZones() {
      $('#admin-body').html(
        '<div class="flex flex-wrap gap-2 justify-between items-center mb-3">' +
          '<input id="zone-search" placeholder="Search zones..." class="' + ui.inputCls + ' w-full sm:max-w-xs">' +
          '<button id="zone-add" class="bg-indigo-600 text-white text-sm px-3.5 py-1.5 rounded-md hover:bg-indigo-700 w-full sm:w-auto">+ Add Zone</button>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
          '<th class="px-3 py-2">#</th><th class="px-3 py-2">Code</th><th class="px-3 py-2">Zone Name</th>' +
          '<th class="px-3 py-2">GPUs</th><th class="px-3 py-2">Wards</th><th class="px-3 py-2">Officials</th><th></th>' +
        '</tr></thead><tbody id="zone-rows"></tbody></table></div>' +
        '<div id="zone-pager"></div>'
      );

      function draw() {
        var q = ($('#zone-search').val() || '').toLowerCase();
        var list = store.where('zones', function (z) {
          return !q || (z.name + ' ' + z.code).toLowerCase().indexOf(q) > -1;
        });
        var meta = ui.pageSlice(list, zonePage, PER);
        zonePage = meta.page;
        var rows = meta.items.map(function (z, i) {
          var insp = store.where('officials', function (o) { return o.zoneId === z.id && o.role === 'inspector'; }).length;
          var swo = store.where('officials', function (o) { return o.zoneId === z.id && o.role === 'swo'; }).length;
          return '<tr class="border-b hover:bg-slate-50">' +
            '<td class="px-3 py-2 text-sm text-slate-400">' + (meta.start + i + 1) + '</td>' +
            '<td class="px-3 py-2"><span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">' + ui.esc(z.code) + '</span></td>' +
            '<td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(z.name) + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + z.gpus.length + ' GPUs</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + z.wards.length + ' wards</td>' +
            '<td class="px-3 py-2 text-sm">' + ui.badge(insp + ' Insp', 'bg-emerald-50 text-emerald-700') + ' ' + ui.badge(swo + ' SWO', 'bg-amber-50 text-amber-700') + '</td>' +
            '<td class="px-3 py-2 text-right whitespace-nowrap">' +
              '<button class="zone-edit text-indigo-600 text-sm hover:underline mr-2" data-id="' + z.id + '">Edit</button>' +
              '<button class="zone-del text-rose-500 text-sm hover:underline" data-id="' + z.id + '">Delete</button>' +
            '</td></tr>';
        }).join('');
        $('#zone-rows').html(rows || '<tr><td colspan="7">' + ui.emptyState('No zones match the search') + '</td></tr>');
        ui.renderPager($('#zone-pager'), meta, function (p) { zonePage = p; draw(); });
      }

      $('#zone-add').on('click', function () { zoneModal(null); });
      $('#zone-rows').on('click', '.zone-edit', function () { zoneModal($(this).data('id')); });
      $('#zone-rows').on('click', '.zone-del', function () {
        var id = $(this).data('id');
        var z = store.find('zones', id);
        ui.modal({
          title: 'Delete Zone', confirmText: 'Delete',
          bodyHtml: '<p class="text-sm text-slate-600">Delete <b>' + ui.esc(z.name) + '</b>? Officials and records linked to this zone will remain but show as unassigned.</p>',
          onConfirm: function () { store.remove('zones', id); ui.toast('Zone deleted', 'success'); draw(); refreshStats(); }
        });
      });
      $('#zone-search').on('input', function () { zonePage = 1; draw(); });
      draw();
    }

    function zoneModal(id) {
      var z = id ? store.find('zones', id) : { code: '', name: '', gpus: [], wards: [], enumerators: [] };
      var enCount = (z.enumerators || []).length;
      var body =
        ui.field('Zone Code', ui.text('code', z.code, { placeholder: 'e.g. Z59' }), { required: true }) +
        ui.field('Zone Name', ui.text('name', z.name, { placeholder: 'e.g. Rangpo' }), { required: true }) +
        ui.field('GPUs (comma separated)', ui.textarea('gpus', z.gpus.join(', '), { placeholder: 'GPU-I, GPU-II' })) +
        ui.field('Wards (comma separated)', ui.textarea('wards', z.wards.join(', '), { placeholder: 'Ward 1, Ward 2' })) +
        '<p class="text-xs text-slate-400 mt-1">' + enCount + ' enumerator(s) configured. Enumerators (Anganwadi workers) are managed by the zone’s inspector from the records page.</p>';
      ui.modal({
        title: id ? 'Edit Zone' : 'Add Zone', confirmText: 'Save',
        bodyHtml: body,
        onConfirm: function () {
          var d = ui.collect($('#modal-body'));
          if (!d.code.trim() || !d.name.trim()) { ui.toast('Code and name are required', 'error'); return false; }
          var payload = {
            code: d.code.trim(), name: d.name.trim(),
            gpus: splitList(d.gpus), wards: splitList(d.wards),
            enumerators: z.enumerators || []   // preserve the inspector-managed list
          };
          if (id) { store.update('zones', id, payload); ui.toast('Zone updated', 'success'); }
          else { store.insert('zones', payload); ui.toast('Zone added', 'success'); }
          renderZones(); refreshStats();
        }
      });
    }

    function splitList(s) {
      return (s || '').split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x.length; });
    }

    // ---------- OFFICIALS ----------
    function renderOfficials() {
      var zones = store.all('zones');
      $('#admin-body').html(
        '<div class="flex flex-wrap gap-2 justify-between items-center mb-3">' +
          '<div class="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">' +
            ui.select('f-role', [{ value: 'inspector', label: 'Inspector' }, { value: 'swo', label: 'SWO' }, { value: 'admin', label: 'Admin' }, { value: 'hq', label: 'HQ' }], '', { placeholder: 'All roles' }).replace('w-full', 'sm:w-40') +
            ui.select('f-zone', zones.map(function (z) { return { value: z.id, label: z.name }; }), '', { placeholder: 'All zones' }).replace('w-full', 'sm:w-48') +
            '<input id="off-search" placeholder="Search name/username..." class="' + ui.inputCls + ' col-span-2 sm:w-56">' +
          '</div>' +
          '<button id="off-add" class="bg-indigo-600 text-white text-sm px-3.5 py-1.5 rounded-md hover:bg-indigo-700 w-full sm:w-auto">+ Add Official</button>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
          '<th class="px-3 py-2">Name</th><th class="px-3 py-2">Username</th><th class="px-3 py-2">Role</th><th class="px-3 py-2">Zone</th><th></th>' +
        '</tr></thead><tbody id="off-rows"></tbody></table></div>' +
        '<div id="off-pager"></div>'
      );

      var offPage = 1;
      function draw() {
        var role = $('[name=f-role]').val();
        var zone = $('[name=f-zone]').val();
        var q = ($('#off-search').val() || '').toLowerCase();
        var list = store.where('officials', function (o) {
          if (role && o.role !== role) return false;
          if (zone && o.zoneId !== zone) return false;
          if (q && (o.name + ' ' + o.username).toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        var meta = ui.pageSlice(list, offPage, PER);
        offPage = meta.page;
        var rows = meta.items.map(function (o) {
          var roleCls = { admin: 'bg-purple-50 text-purple-700', hq: 'bg-blue-50 text-blue-700', inspector: 'bg-emerald-50 text-emerald-700', swo: 'bg-amber-50 text-amber-700' }[o.role];
          return '<tr class="border-b hover:bg-slate-50">' +
            '<td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(o.name) + '</td>' +
            '<td class="px-3 py-2 text-xs font-mono text-slate-500">' + ui.esc(o.username) + '</td>' +
            '<td class="px-3 py-2">' + ui.badge(C.roles[o.role], roleCls) + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + (o.zoneId ? ui.esc(zoneName(o.zoneId)) : '—') + '</td>' +
            '<td class="px-3 py-2 text-right whitespace-nowrap">' +
              '<button class="off-edit text-indigo-600 text-sm hover:underline mr-2" data-id="' + o.id + '">Edit</button>' +
              '<button class="off-del text-rose-500 text-sm hover:underline" data-id="' + o.id + '">Delete</button>' +
            '</td></tr>';
        }).join('');
        $('#off-rows').html(rows || '<tr><td colspan="5">' + ui.emptyState('No officials match the filter') + '</td></tr>');
        ui.renderPager($('#off-pager'), meta, function (p) { offPage = p; draw(); });
      }

      $('[name=f-role], [name=f-zone]').on('change', function () { offPage = 1; draw(); });
      $('#off-search').on('input', function () { offPage = 1; draw(); });
      $('#off-add').on('click', function () { officialModal(null); });
      $('#off-rows').on('click', '.off-edit', function () { officialModal($(this).data('id')); });
      $('#off-rows').on('click', '.off-del', function () {
        var id = $(this).data('id');
        var o = store.find('officials', id);
        ui.modal({
          title: 'Delete Official', confirmText: 'Delete',
          bodyHtml: '<p class="text-sm text-slate-600">Remove <b>' + ui.esc(o.name) + '</b> (' + ui.esc(o.username) + ')?</p>',
          onConfirm: function () { store.remove('officials', id); ui.toast('Official removed', 'success'); draw(); refreshStats(); }
        });
      });
      draw();
    }

    // ---------- SURVEYS ----------
    function renderSurveys() {
      $('#admin-body').html(
        '<div class="flex flex-wrap gap-2 justify-between items-center mb-3">' +
          '<p class="text-sm text-slate-500">Create a survey per period (e.g. 2026-27). Inspectors enter Form A/B records against an <b>active</b> survey.</p>' +
          '<button id="srv-add" class="bg-indigo-600 text-white text-sm px-3.5 py-1.5 rounded-md hover:bg-indigo-700 w-full sm:w-auto">+ New Survey</button>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
          '<th class="px-3 py-2">Survey</th><th class="px-3 py-2">Period</th><th class="px-3 py-2">Records</th><th class="px-3 py-2">Status</th><th></th>' +
        '</tr></thead><tbody id="srv-rows"></tbody></table></div>'
      );

      function draw() {
        var surveys = store.all('surveys').slice().sort(function (a, b) { return (b.period || '').localeCompare(a.period || ''); });
        var rows = surveys.map(function (s) {
          var cnt = store.where('beneficiaries', function (b) { return b.surveyId === s.id; }).length;
          var badge = s.status === 'active' ? ui.badge('Active', 'bg-emerald-100 text-emerald-700') : ui.badge('Closed', 'bg-slate-200 text-slate-600');
          return '<tr class="border-b hover:bg-slate-50">' +
            '<td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(s.name) + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + ui.esc(s.period) + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + cnt + '</td>' +
            '<td class="px-3 py-2">' + badge + '</td>' +
            '<td class="px-3 py-2 text-right whitespace-nowrap">' +
              '<button class="srv-toggle text-' + (s.status === 'active' ? 'amber' : 'emerald') + '-600 text-sm hover:underline mr-2" data-id="' + s.id + '">' + (s.status === 'active' ? 'Close' : 'Reopen') + '</button>' +
              '<button class="srv-edit text-indigo-600 text-sm hover:underline mr-2" data-id="' + s.id + '">Edit</button>' +
              '<button class="srv-del text-rose-500 text-sm hover:underline" data-id="' + s.id + '">Delete</button>' +
            '</td></tr>';
        }).join('');
        $('#srv-rows').html(rows || '<tr><td colspan="5">' + ui.emptyState('No surveys yet. Create one to start data entry.') + '</td></tr>');
      }

      $('#srv-add').on('click', function () { surveyModal(null, draw); });
      $('#srv-rows').on('click', '.srv-edit', function () { surveyModal($(this).data('id'), draw); });
      $('#srv-rows').on('click', '.srv-toggle', function () {
        var s = store.find('surveys', $(this).data('id'));
        store.update('surveys', s.id, { status: s.status === 'active' ? 'closed' : 'active' });
        ui.toast('Survey ' + (s.status === 'active' ? 'closed' : 'reopened'), 'success');
        draw();
      });
      $('#srv-rows').on('click', '.srv-del', function () {
        var s = store.find('surveys', $(this).data('id'));
        var cnt = store.where('beneficiaries', function (b) { return b.surveyId === s.id; }).length;
        if (cnt > 0) { ui.toast('Cannot delete: ' + cnt + ' records belong to this survey', 'error'); return; }
        ui.modal({
          title: 'Delete Survey', confirmText: 'Delete',
          bodyHtml: '<p class="text-sm text-slate-600">Delete <b>' + ui.esc(s.name) + '</b>?</p>',
          onConfirm: function () { store.remove('surveys', s.id); ui.toast('Survey deleted', 'success'); draw(); }
        });
      });
      draw();
    }

    function surveyModal(id, after) {
      var s = id ? store.find('surveys', id) : { name: '', period: '', status: 'active' };
      var body =
        ui.field('Survey Name', ui.text('name', s.name, { placeholder: 'e.g. PwD Survey 2026-27' }), { required: true }) +
        ui.field('Period', ui.text('period', s.period, { placeholder: 'e.g. 2026-27' }), { required: true }) +
        ui.field('Status', ui.select('status', [{ value: 'active', label: 'Active (accepts entries)' }, { value: 'closed', label: 'Closed' }], s.status), { required: true });
      ui.modal({
        title: id ? 'Edit Survey' : 'New Survey', confirmText: 'Save', bodyHtml: body,
        onConfirm: function () {
          var d = ui.collect($('#modal-body'));
          if (!d.name.trim() || !d.period.trim()) { ui.toast('Name and period are required', 'error'); return false; }
          var payload = { name: d.name.trim(), period: d.period.trim(), status: d.status };
          if (id) { store.update('surveys', id, payload); ui.toast('Survey updated', 'success'); }
          else { payload.createdAt = new Date().toISOString(); store.insert('surveys', payload); ui.toast('Survey created', 'success'); }
          if (after) after();
        }
      });
    }

    function officialModal(id) {
      var zones = store.all('zones');
      var o = id ? store.find('officials', id) : { name: '', username: '', role: 'inspector', zoneId: '' };
      var body =
        ui.field('Full Name', ui.text('name', o.name), { required: true }) +
        ui.field('Username', ui.text('username', o.username, { placeholder: 'login id' }), { required: true, hint: 'Used to sign in (no password in prototype).' }) +
        ui.field('Role', ui.select('role', [{ value: 'inspector', label: 'Inspector' }, { value: 'swo', label: 'SWO' }, { value: 'hq', label: 'HQ Official' }, { value: 'admin', label: 'Administrator' }], o.role), { required: true }) +
        ui.field('Assigned Zone', ui.select('zoneId', zones.map(function (z) { return { value: z.id, label: z.name + ' (' + z.code + ')' }; }), o.zoneId), { hint: 'Required for Inspector / SWO.', name: 'zoneId' });
      ui.modal({
        title: id ? 'Edit Official' : 'Add Official', confirmText: 'Save', bodyHtml: body,
        onConfirm: function () {
          var d = ui.collect($('#modal-body'));
          if (!d.name.trim() || !d.username.trim()) { ui.toast('Name and username required', 'error'); return false; }
          if ((d.role === 'inspector' || d.role === 'swo') && !d.zoneId) { ui.toast('Zone required for this role', 'error'); return false; }
          // unique username
          var clash = store.where('officials', function (x) { return x.username.toLowerCase() === d.username.trim().toLowerCase() && x.id !== id; });
          if (clash.length) { ui.toast('Username already exists', 'error'); return false; }
          var payload = { name: d.name.trim(), username: d.username.trim(), role: d.role, zoneId: (d.role === 'inspector' || d.role === 'swo') ? d.zoneId : null };
          if (id) { store.update('officials', id, payload); ui.toast('Official updated', 'success'); }
          else { store.insert('officials', payload); ui.toast('Official added', 'success'); }
          renderOfficials(); refreshStats();
        }
      });
    }

    function refreshStats() {
      var k = counts();
      $('#admin-stats').replaceWith(buildStats());
    }
    function buildStats() {
      var k = counts();
      return '<div id="admin-stats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-5">' +
        statCard('Surveys', k.surveys, 'bg-blue-50 text-blue-700') +
        statCard('Zones', k.zones, 'bg-indigo-50 text-indigo-700') +
        statCard('Inspectors', k.inspectors, 'bg-emerald-50 text-emerald-700') +
        statCard('SWOs', k.swos, 'bg-amber-50 text-amber-700') +
        statCard('Beneficiary Records', k.records, 'bg-rose-50 text-rose-700') + '</div>';
    }

    // ---------- MASTERS (admin-configurable dropdown lists, one screen per config) ----------
    function masterDef(key) { return (C.masterKeys || []).filter(function (m) { return m.key === key; })[0]; }

    function renderMasters() {
      var keys = C.masterKeys || [];
      $('#admin-body').html(
        '<p class="text-sm text-slate-500 mb-3">Each configuration is managed separately. Items carry an <b>ID</b> (stable key) and a <b>Name</b> (shown in the survey-form dropdowns). These lists are provided by the department.</p>' +
        '<div class="flex flex-wrap gap-2 mb-4" id="master-subtabs">' +
          keys.map(function (m) {
            return '<button class="master-subtab px-3 py-1.5 text-sm rounded-md border ' +
              (masterSub === m.key ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50') +
              '" data-key="' + m.key + '">' + ui.esc(m.label) + '</button>';
          }).join('') +
        '</div>' +
        '<div id="master-pane"></div>'
      );
      $('#master-subtabs').on('click', '.master-subtab', function () { masterSub = $(this).data('key'); renderMasters(); });
      renderMasterPane();
    }

    function renderMasterPane() {
      var def = masterDef(masterSub);
      if (!def) return;
      var items = store.masterItems(def.key);
      $('#master-pane').html(
        '<div class="flex items-center justify-between mb-3">' +
          '<div><h3 class="font-semibold text-slate-700 text-sm">' + ui.esc(def.label) + '</h3>' +
            '<p class="text-xs text-slate-400">' + items.length + ' item(s) · drives the “' + ui.esc(def.label) + '” dropdown in the survey form.</p></div>' +
          '<button id="master-add" class="bg-indigo-600 text-white text-sm px-3.5 py-1.5 rounded-md hover:bg-indigo-700">+ Add</button>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
          '<th class="px-3 py-2">#</th><th class="px-3 py-2">ID</th><th class="px-3 py-2">Name</th><th></th>' +
        '</tr></thead><tbody id="master-rows"></tbody></table></div>'
      );
      drawMasterRows();
      $('#master-add').on('click', function () { masterItemModal(def, null); });
      $('#master-rows').on('click', '.master-edit', function () {
        var id = $(this).data('id');
        var it = store.masterItems(def.key).filter(function (x) { return x.id === String(id); })[0];
        if (it) masterItemModal(def, it);
      });
      $('#master-rows').on('click', '.master-del', function () {
        var id = String($(this).data('id'));
        var it = store.masterItems(def.key).filter(function (x) { return x.id === id; })[0];
        if (!it) return;
        ui.modal({
          title: 'Delete ' + def.label, confirmText: 'Delete',
          bodyHtml: '<p class="text-sm text-slate-600">Delete <b>' + ui.esc(it.name) + '</b>? Existing records keep their stored value; only the dropdown option is removed.</p>',
          onConfirm: function () {
            store.setMasterItems(def.key, store.masterItems(def.key).filter(function (x) { return x.id !== id; }));
            ui.toast(def.label + ' item deleted', 'success');
            renderMasterPane();
          }
        });
      });
    }

    function drawMasterRows() {
      var items = store.masterItems(masterSub);
      var rows = items.map(function (it, i) {
        return '<tr class="border-b hover:bg-slate-50">' +
          '<td class="px-3 py-2 text-sm text-slate-400">' + (i + 1) + '</td>' +
          '<td class="px-3 py-2"><span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">' + ui.esc(it.id) + '</span></td>' +
          '<td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(it.name) + '</td>' +
          '<td class="px-3 py-2 text-right whitespace-nowrap">' +
            '<button class="master-edit text-indigo-600 text-sm hover:underline mr-2" data-id="' + ui.esc(it.id) + '">Edit</button>' +
            '<button class="master-del text-rose-500 text-sm hover:underline" data-id="' + ui.esc(it.id) + '">Delete</button>' +
          '</td></tr>';
      }).join('');
      $('#master-rows').html(rows || '<tr><td colspan="4">' + ui.emptyState('No items yet. Add one to populate the dropdown.') + '</td></tr>');
    }

    function masterItemModal(def, item) {
      var isEdit = !!item;
      var body =
        ui.field('ID', ui.text('mid', item ? item.id : '', { placeholder: 'auto-generate if blank', attrs: isEdit ? 'readonly' : '' }),
          { hint: isEdit ? 'ID is fixed once created.' : 'Optional — a unique id is generated if left blank.' }) +
        ui.field('Name', ui.text('mname', item ? item.name : '', { placeholder: 'Display name shown in dropdowns' }), { required: true });
      ui.modal({
        title: (isEdit ? 'Edit ' : 'Add ') + def.label, confirmText: 'Save', bodyHtml: body,
        onConfirm: function () {
          var d = ui.collect($('#modal-body'));
          var name = (d.mname || '').trim();
          if (!name) { ui.toast('Name is required', 'error'); return false; }
          var items = store.masterItems(def.key);
          if (isEdit) {
            items = items.map(function (it) { return it.id === item.id ? { id: item.id, name: name } : it; });
          } else {
            var id = (d.mid || '').trim() || store.uid('mst');
            if (items.some(function (it) { return it.id === id; })) { ui.toast('ID already exists', 'error'); return false; }
            items.push({ id: id, name: name });
          }
          store.setMasterItems(def.key, items);
          ui.toast(def.label + ' saved', 'success');
          renderMasterPane();
        }
      });
    }

    function draw() {
      $c.html(
        buildStats() +
        '<div class="bg-white rounded-xl shadow-sm border">' +
          '<div class="border-b px-4 flex gap-1 overflow-x-auto">' + tabBtn('surveys', 'Surveys') + tabBtn('zones', 'Zones') + tabBtn('officials', 'Officials') + tabBtn('masters', 'Masters') + '</div>' +
          '<div id="admin-body" class="p-4"></div>' +
        '</div>'
      );
      // tab clicks navigate by hash so the sidebar menu stays in sync
      $('.admin-tab').on('click', function () {
        var t = $(this).data('tab');
        SDMIS.router.go(t === 'surveys' ? '#/admin' : '#/admin/' + t);
      });
      $('#page-title').text(TAB_LABELS[tab] || 'Configuration');
      if (tab === 'surveys') renderSurveys();
      else if (tab === 'zones') renderZones();
      else if (tab === 'masters') renderMasters();
      else renderOfficials();
    }

    draw();
  }
});
