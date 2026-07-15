/* SDMIS — Admin: configure zones & officials */
window.SDMIS = window.SDMIS || {};

SDMIS.router.register('admin', {
  roles: ['admin'],
  title: 'Configuration',
  render: function ($c, params) {
    var store = SDMIS.store, ui = SDMIS.ui, C = SDMIS.constants;
    var TAB_LABELS = { surveys: 'Surveys', officials: 'Officials', masters: 'Masters' };
    var tab = (params && params[0] && TAB_LABELS[params[0]]) ? params[0] : 'surveys';
    var masterSub = (C.masterKeys[0] || {}).key;

    function counts() {
      return {
        surveys: store.all('surveys').length,
        districts: store.master('districts').length,
        blocks: store.master('blocks').length,
        inspectors: store.where('officials', function (o) { return o.role === 'inspector'; }).length,
        swos: store.where('officials', function (o) { return o.role === 'swo'; }).length,
        records: store.all('beneficiaries').length
      };
    }

    // How an official is mapped: inspectors to Blocks, SWOs to a District.
    function mappingText(o) {
      if (o.role === 'inspector') return (o.blocks && o.blocks.length) ? o.blocks.join(', ') : '—';
      if (o.role === 'swo') return o.district || '—';
      return '—';
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

    var PER = 10;

    // ---------- OFFICIALS ----------
    function renderOfficials() {
      $('#admin-body').html(
        '<div class="flex flex-wrap gap-2 justify-between items-center mb-3">' +
          '<div class="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">' +
            ui.select('f-role', [{ value: 'inspector', label: 'Inspector' }, { value: 'swo', label: 'SWO' }, { value: 'admin', label: 'Admin' }, { value: 'hq', label: 'HQ' }], '', { placeholder: 'All roles' }).replace('w-full', 'sm:w-40') +
            '<input id="off-search" placeholder="Search name/username..." class="' + ui.inputCls + ' col-span-2 sm:w-56">' +
          '</div>' +
          '<button id="off-add" class="bg-indigo-600 text-white text-sm px-3.5 py-1.5 rounded-md hover:bg-indigo-700 w-full sm:w-auto">+ Add Official</button>' +
        '</div>' +
        '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
          '<th class="px-3 py-2">Name</th><th class="px-3 py-2">Username</th><th class="px-3 py-2">Role</th><th class="px-3 py-2">Mapped To</th><th></th>' +
        '</tr></thead><tbody id="off-rows"></tbody></table></div>' +
        '<div id="off-pager"></div>'
      );

      var offPage = 1;
      function draw() {
        var role = $('[name=f-role]').val();
        var q = ($('#off-search').val() || '').toLowerCase();
        var list = store.where('officials', function (o) {
          if (role && o.role !== role) return false;
          if (q && (o.name + ' ' + o.username).toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        var meta = ui.pageSlice(list, offPage, PER);
        offPage = meta.page;
        var rows = meta.items.map(function (o) {
          var roleCls = { admin: 'bg-purple-50 text-purple-700', hq: 'bg-blue-50 text-blue-700', inspector: 'bg-emerald-50 text-emerald-700', swo: 'bg-amber-50 text-amber-700' }[o.role];
          var mapLabel = o.role === 'inspector' ? 'Blocks' : (o.role === 'swo' ? 'District' : '');
          return '<tr class="border-b hover:bg-slate-50">' +
            '<td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(o.name) + '</td>' +
            '<td class="px-3 py-2 text-xs font-mono text-slate-500">' + ui.esc(o.username) + '</td>' +
            '<td class="px-3 py-2">' + ui.badge(C.roles[o.role], roleCls) + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + (mapLabel ? '<span class="text-slate-400 text-xs">' + mapLabel + ':</span> ' : '') + ui.esc(mappingText(o)) + '</td>' +
            '<td class="px-3 py-2 text-right whitespace-nowrap">' +
              '<button class="off-edit text-indigo-600 text-sm hover:underline mr-2" data-id="' + o.id + '">Edit</button>' +
              '<button class="off-del text-rose-500 text-sm hover:underline" data-id="' + o.id + '">Delete</button>' +
            '</td></tr>';
        }).join('');
        $('#off-rows').html(rows || '<tr><td colspan="5">' + ui.emptyState('No officials match the filter') + '</td></tr>');
        ui.renderPager($('#off-pager'), meta, function (p) { offPage = p; draw(); });
      }

      $('[name=f-role]').on('change', function () { offPage = 1; draw(); });
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
      var o = id ? store.find('officials', id) : { name: '', username: '', role: 'inspector', blocks: [], district: '', enumerators: [] };
      var body =
        ui.field('Full Name', ui.text('name', o.name), { required: true }) +
        ui.field('Username', ui.text('username', o.username, { placeholder: 'login id' }), { required: true, hint: 'Used to sign in (no password in prototype).' }) +
        ui.field('Role', ui.select('role', [{ value: 'inspector', label: 'Inspector' }, { value: 'swo', label: 'SWO' }, { value: 'hq', label: 'HQ Official' }, { value: 'admin', label: 'Administrator' }], o.role), { required: true }) +
        // Inspector → one or more Blocks; SWO → a District
        '<div id="map-blocks">' + ui.field('Mapped Blocks', ui.multiSelect('blocks', store.master('blocks'), o.blocks || [], { placeholder: 'Select block(s)…' }), { hint: 'Inspector can enter records for these blocks.', name: 'blocks' }) + '</div>' +
        '<div id="map-district">' + ui.field('Mapped District', ui.select('district', store.master('districts'), o.district || ''), { hint: 'SWO verifies all records in this district.', name: 'district' }) + '</div>';
      ui.modal({
        title: id ? 'Edit Official' : 'Add Official', confirmText: 'Save', bodyHtml: body,
        onConfirm: function () {
          var d = ui.collect($('#modal-body'));
          if (!d.name.trim() || !d.username.trim()) { ui.toast('Name and username required', 'error'); return false; }
          var blocks = d.blocks || [];
          if (d.role === 'inspector' && !blocks.length) { ui.toast('Assign at least one block to an inspector', 'error'); return false; }
          if (d.role === 'swo' && !d.district) { ui.toast('A district is required for a SWO', 'error'); return false; }
          // unique username
          var clash = store.where('officials', function (x) { return x.username.toLowerCase() === d.username.trim().toLowerCase() && x.id !== id; });
          if (clash.length) { ui.toast('Username already exists', 'error'); return false; }
          var payload = {
            name: d.name.trim(), username: d.username.trim(), role: d.role,
            blocks: d.role === 'inspector' ? blocks : [],
            district: d.role === 'swo' ? d.district : '',
            enumerators: o.enumerators || []   // preserve the inspector-managed enumerator list
          };
          if (id) { store.update('officials', id, payload); ui.toast('Official updated', 'success'); }
          else { store.insert('officials', payload); ui.toast('Official added', 'success'); }
          renderOfficials(); refreshStats();
        }
      });
      // show only the mapping relevant to the chosen role
      function refreshRoleFields() {
        var role = $('#modal-body [name=role]').val();
        $('#map-blocks').toggle(role === 'inspector');
        $('#map-district').toggle(role === 'swo');
      }
      $('#modal-body [name=role]').on('change', refreshRoleFields);
      refreshRoleFields();
      ui.enhanceMultiSelects($('#modal-body'));
    }

    function refreshStats() {
      var k = counts();
      $('#admin-stats').replaceWith(buildStats());
    }
    function buildStats() {
      var k = counts();
      return '<div id="admin-stats" class="grid grid-cols-2 md:grid-cols-6 gap-4 mb-5">' +
        statCard('Surveys', k.surveys, 'bg-blue-50 text-blue-700') +
        statCard('Districts', k.districts, 'bg-indigo-50 text-indigo-700') +
        statCard('Blocks', k.blocks, 'bg-cyan-50 text-cyan-700') +
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
          '<th class="px-3 py-2">#</th><th class="px-3 py-2">ID</th><th class="px-3 py-2">Name</th>' +
          (def.key === 'blocks' ? '<th class="px-3 py-2">District</th>' : '') + '<th></th>' +
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
      var isBlock = masterSub === 'blocks';
      var items = store.masterItems(masterSub);
      var rows = items.map(function (it, i) {
        return '<tr class="border-b hover:bg-slate-50">' +
          '<td class="px-3 py-2 text-sm text-slate-400">' + (i + 1) + '</td>' +
          '<td class="px-3 py-2"><span class="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">' + ui.esc(it.id) + '</span></td>' +
          '<td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(it.name) + '</td>' +
          (isBlock ? '<td class="px-3 py-2 text-sm text-slate-500">' + ui.esc(it.district || '—') + '</td>' : '') +
          '<td class="px-3 py-2 text-right whitespace-nowrap">' +
            '<button class="master-edit text-indigo-600 text-sm hover:underline mr-2" data-id="' + ui.esc(it.id) + '">Edit</button>' +
            '<button class="master-del text-rose-500 text-sm hover:underline" data-id="' + ui.esc(it.id) + '">Delete</button>' +
          '</td></tr>';
      }).join('');
      $('#master-rows').html(rows || '<tr><td colspan="' + (isBlock ? 5 : 4) + '">' + ui.emptyState('No items yet. Add one to populate the dropdown.') + '</td></tr>');
    }

    function masterItemModal(def, item) {
      var isEdit = !!item;
      var isBlock = def.key === 'blocks';   // blocks carry a parent District
      var body =
        ui.field('ID', ui.text('mid', item ? item.id : '', { placeholder: 'auto-generate if blank', attrs: isEdit ? 'readonly' : '' }),
          { hint: isEdit ? 'ID is fixed once created.' : 'Optional — a unique id is generated if left blank.' }) +
        ui.field('Name', ui.text('mname', item ? item.name : '', { placeholder: 'Display name shown in dropdowns' }), { required: true }) +
        (isBlock ? ui.field('District', ui.select('mdistrict', store.master('districts'), item ? (item.district || '') : ''), { required: true, hint: 'The district this block belongs to.', name: 'mdistrict' }) : '');
      ui.modal({
        title: (isEdit ? 'Edit ' : 'Add ') + def.label, confirmText: 'Save', bodyHtml: body,
        onConfirm: function () {
          var d = ui.collect($('#modal-body'));
          var name = (d.mname || '').trim();
          if (!name) { ui.toast('Name is required', 'error'); return false; }
          if (isBlock && !d.mdistrict) { ui.toast('Select the district this block belongs to', 'error'); return false; }
          var items = store.masterItems(def.key);
          if (isEdit) {
            items = items.map(function (it) {
              if (it.id !== item.id) return it;
              return isBlock ? { id: item.id, name: name, district: d.mdistrict } : { id: item.id, name: name };
            });
          } else {
            var id = (d.mid || '').trim() || store.uid('mst');
            if (items.some(function (it) { return it.id === id; })) { ui.toast('ID already exists', 'error'); return false; }
            items.push(isBlock ? { id: id, name: name, district: d.mdistrict } : { id: id, name: name });
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
          '<div class="border-b px-4 flex gap-1 overflow-x-auto">' + tabBtn('surveys', 'Surveys') + tabBtn('officials', 'Officials') + tabBtn('masters', 'Masters') + '</div>' +
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
      else if (tab === 'masters') renderMasters();
      else renderOfficials();
    }

    draw();
  }
});
