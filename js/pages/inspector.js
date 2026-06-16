/* SDMIS — Inspector: zone work-list + Form A/B entry */
window.SDMIS = window.SDMIS || {};

SDMIS.router.register('inspector', {
  roles: ['inspector'],
  title: 'My Records',
  render: function ($c, params) {
    var store = SDMIS.store, ui = SDMIS.ui, C = SDMIS.constants;
    var auth = SDMIS.auth;
    var user = auth.current();
    var zone = auth.currentZone();
    var PER = 8;

    // ---- survey selection (persisted per user) ----
    var PREF_KEY = 'inspectorSurvey:' + user.id;
    function activeSurveys() { return store.where('surveys', function (s) { return s.status === 'active'; }); }
    function currentSurveyId() {
      var saved = store.getPref(PREF_KEY, null);
      if (saved && store.find('surveys', saved)) return saved;
      var act = activeSurveys()[0];
      return act ? act.id : (store.all('surveys')[0] ? store.all('surveys')[0].id : null);
    }
    function currentSurvey() { var id = currentSurveyId(); return id ? store.find('surveys', id) : null; }

    // routing within module: [] | ['new','A'] | ['edit', id] | ['view', id]
    if (params[0] === 'new' && (params[1] === 'A' || params[1] === 'B')) {
      var srv = currentSurvey();
      if (!srv || srv.status !== 'active') { ui.toast('Select an active survey before adding records', 'error'); return list(); }
      var blank = SDMIS.formWizard.blankRecord(params[1], zone ? zone.id : null, user.id, srv.id);
      blank.enumeratorId = defaultEnumeratorId();
      return openWizard(blank);
    }
    if (params[0] === 'edit' && params[1]) {
      var rec = store.find('beneficiaries', params[1]);
      if (rec) return openWizard(rec);
    }
    if (params[0] === 'view' && params[1]) {
      var vrec = store.find('beneficiaries', params[1]);
      if (vrec) return viewRecord(vrec);
    }
    return list();

    function openWizard(rec) {
      SDMIS.formWizard.open($c, {
        record: rec, zone: zone,
        afterSave: function () { SDMIS.router.go('#/inspector'); },
        onCancel: function () { SDMIS.router.go('#/inspector'); }
      });
    }

    function myRecords() {
      var sid = currentSurveyId();
      return store.where('beneficiaries', function (b) {
        return zone && b.zoneId === zone.id && b.surveyId === sid;
      }).sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    }

    // Default enumerator for a NEW form: the only one if there's a single enumerator,
    // otherwise the one this inspector used most recently in this zone.
    function defaultEnumeratorId() {
      var ens = (zone && zone.enumerators) || [];
      if (!ens.length) return null;
      if (ens.length === 1) return ens[0].id;
      var valid = {};
      ens.forEach(function (e) { valid[e.id] = true; });
      var prior = store.where('beneficiaries', function (b) {
        return zone && b.zoneId === zone.id && b.createdBy === user.id && b.enumeratorId && valid[b.enumeratorId];
      }).sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
      return prior.length ? prior[0].enumeratorId : null;
    }

    function viewRecord(rec) {
      $c.html(
        '<div class="max-w-3xl mx-auto">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<button id="back" class="text-sm text-slate-500 hover:text-slate-800">&larr; Back to records</button>' +
            ui.statusBadge(rec.status) +
          '</div>' +
          '<div class="bg-white rounded-xl border shadow-sm p-6">' +
            '<div class="flex items-center justify-between mb-4">' +
              '<h2 class="text-lg font-semibold text-slate-800">' + ui.esc(rec.step1.name || 'Unnamed') + '</h2>' +
              (rec.formType === 'A' ? ui.badge('Form A', 'bg-emerald-100 text-emerald-700') : ui.badge('Form B', 'bg-amber-100 text-amber-700')) +
            '</div>' +
            SDMIS.formWizard.readOnlyHtml(rec) +
          '</div></div>'
      );
      $('#back').on('click', function () { SDMIS.router.go('#/inspector'); });
    }

    function list() {
      var recs = myRecords();
      var stats = { draft: 0, submitted: 0, returned: 0, approved: 0, A: 0, B: 0 };
      recs.forEach(function (r) { stats[r.status]++; stats[r.formType]++; });

      var surveys = store.all('surveys').slice().sort(function (a, b) { return (b.period || '').localeCompare(a.period || ''); });
      var srv = currentSurvey();
      var isActive = srv && srv.status === 'active';
      var surveyOpts = surveys.map(function (s) { return { value: s.id, label: s.name + (s.status === 'active' ? '' : ' (closed)') }; });

      var closedNotice = (srv && !isActive)
        ? '<div class="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-2 mb-4">This survey is <b>closed</b> — existing records are read-only and new entries are disabled. Switch to an active survey to add records.</div>'
        : (!srv ? '<div class="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg px-4 py-2 mb-4">No survey available. Ask an administrator to create one.</div>' : '');

      var newBtns = isActive
        ? '<button id="new-a" class="bg-emerald-600 text-white text-sm px-3.5 py-2 rounded-md hover:bg-emerald-700">+ New Form A (Certified)</button>' +
          '<button id="new-b" class="bg-amber-600 text-white text-sm px-3.5 py-2 rounded-md hover:bg-amber-700">+ New Form B (Suspected)</button>'
        : '<button class="bg-slate-200 text-slate-400 text-sm px-3.5 py-2 rounded-md cursor-not-allowed" disabled>+ New Form A</button>' +
          '<button class="bg-slate-200 text-slate-400 text-sm px-3.5 py-2 rounded-md cursor-not-allowed" disabled>+ New Form B</button>';

      $c.html(
        // survey + zone banner + actions
        '<div class="flex flex-wrap gap-3 justify-between items-start mb-4">' +
          '<div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">' +
            '<div class="bg-white border rounded-xl px-3 py-2 text-sm">' +
              '<label class="block text-[11px] text-slate-400 mb-0.5">Survey</label>' +
              ui.select('survey-sel', surveyOpts, srv ? srv.id : '', { placeholder: 'No survey' }).replace(ui.inputCls, ui.inputCls + ' min-w-[200px]') +
            '</div>' +
            '<div class="bg-white border rounded-xl px-4 py-2.5 text-sm flex items-center gap-3">' +
              '<span><span class="text-slate-400">Zone:</span>&nbsp;<span class="font-semibold text-slate-700">' + (zone ? ui.esc(zone.name) + ' (' + ui.esc(zone.code) + ')' : 'None') + '</span></span>' +
              (zone
                ? '<button id="enum-manage" class="text-indigo-600 text-xs hover:underline whitespace-nowrap border-l pl-3">' +
                    '⚇ Enumerators (' + ((zone.enumerators || []).length) + ')'
                  + '</button>'
                : '') +
            '</div>' +
          '</div>' +
          '<div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">' + newBtns + '</div>' +
        '</div>' +
        closedNotice +
        // stat strip
        '<div class="grid grid-cols-3 md:grid-cols-6 gap-3 mb-5">' +
          miniStat('Total', recs.length, 'text-slate-700') +
          miniStat('Form A', stats.A, 'text-emerald-600') +
          miniStat('Form B', stats.B, 'text-amber-600') +
          miniStat('Drafts', stats.draft, 'text-slate-500') +
          miniStat('Submitted', stats.submitted, 'text-blue-600') +
          miniStat('Returned', stats.returned, 'text-rose-600') +
        '</div>' +
        // table
        '<div class="bg-white rounded-xl border shadow-sm">' +
          '<div class="p-3 border-b flex flex-wrap gap-3 justify-between items-center">' +
            '<input id="rec-search" placeholder="Search by name..." class="' + ui.inputCls + ' w-full sm:max-w-xs">' +
            '<div class="flex flex-wrap gap-2 text-sm">' + filterChip('all', 'All') + filterChip('draft', 'Drafts') + filterChip('returned', 'Returned') + filterChip('submitted', 'Submitted') + filterChip('approved', 'Approved') + '</div>' +
          '</div>' +
          '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
            '<th class="px-3 py-2">Beneficiary</th><th class="px-3 py-2">Form</th><th class="px-3 py-2">GPU</th><th class="px-3 py-2">Ward</th><th class="px-3 py-2">Age/Gender</th><th class="px-3 py-2">Status</th><th></th>' +
          '</tr></thead><tbody id="rec-rows"></tbody></table></div>' +
          '<div id="rec-pager"></div>' +
        '</div>'
      );

      $('#survey-sel').on('change', function () { store.setPref(PREF_KEY, $(this).val()); list(); });
      $('#enum-manage').on('click', enumeratorsModal);
      $('#new-a').on('click', function () { SDMIS.router.go('#/inspector/new/A'); });
      $('#new-b').on('click', function () { SDMIS.router.go('#/inspector/new/B'); });
      $('#rec-rows').on('click', '.rec-edit', function () { SDMIS.router.go('#/inspector/edit/' + $(this).data('id')); });
      $('#rec-rows').on('click', '.rec-view', function () { SDMIS.router.go('#/inspector/view/' + $(this).data('id')); });

      var activeFilter = 'all', recPage = 1;
      function draw() {
        var q = ($('#rec-search').val() || '').toLowerCase();
        var filtered = recs.filter(function (r) {
          var matchFilter = activeFilter === 'all' || r.status === activeFilter;
          var matchSearch = !q || (r.step1.name || '').toLowerCase().indexOf(q) > -1;
          return matchFilter && matchSearch;
        });
        var meta = ui.pageSlice(filtered, recPage, PER);
        recPage = meta.page;
        var rows = meta.items.map(function (r) {
          var editable = isActive && (r.status === 'draft' || r.status === 'returned');
          return '<tr class="border-b hover:bg-slate-50">' +
            '<td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(r.step1.name || '(no name)') +
              (r.status === 'returned' ? ' <span class="text-rose-500 text-xs">↩ returned</span>' : '') + '</td>' +
            '<td class="px-3 py-2">' + (r.formType === 'A' ? ui.badge('A', 'bg-emerald-100 text-emerald-700') : ui.badge('B', 'bg-amber-100 text-amber-700')) + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + ui.esc(r.gpu || '—') + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + ui.esc(r.ward || '—') + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + ui.esc((r.step1.age || '—') + ' / ' + (r.step1.gender || '—')) + '</td>' +
            '<td class="px-3 py-2">' + ui.statusBadge(r.status) + '</td>' +
            '<td class="px-3 py-2 text-right whitespace-nowrap">' +
              (editable
                ? '<button class="rec-edit text-indigo-600 text-sm hover:underline" data-id="' + r.id + '">Edit</button>'
                : '<button class="rec-view text-slate-500 text-sm hover:underline" data-id="' + r.id + '">View</button>') +
            '</td></tr>';
        }).join('');
        $('#rec-rows').html(rows || '<tr><td colspan="7">' + ui.emptyState('No records match. Create a Form A or Form B to begin.') + '</td></tr>');
        ui.renderPager($('#rec-pager'), meta, function (p) { recPage = p; draw(); });
      }

      $('#rec-search').on('input', function () { recPage = 1; draw(); });
      $('.filter-chip').on('click', function () {
        activeFilter = $(this).data('f'); recPage = 1;
        $('.filter-chip').removeClass('bg-indigo-600 text-white').addClass('bg-slate-100 text-slate-600');
        $(this).removeClass('bg-slate-100 text-slate-600').addClass('bg-indigo-600 text-white');
        draw();
      });
      draw();
    }

    // Manage the list of enumerators (Anganwadi workers) for this inspector's zone
    function enumeratorsModal() {
      if (!zone) { ui.toast('No zone assigned to your account', 'error'); return; }
      var ens = zone.enumerators || [];
      var rows = ens.length
        ? ens.map(function (en) {
            return '<div class="flex items-center justify-between border rounded-lg px-3 py-2 mb-2">' +
              '<div><div class="text-sm font-medium text-slate-700">' + ui.esc(en.name) + '</div>' +
              '<div class="text-xs text-slate-400">' + ui.esc([en.awc, en.project, en.district, en.contact].filter(Boolean).join(' · ') || '—') + '</div></div>' +
              '<div class="whitespace-nowrap">' +
                '<button class="en-edit text-indigo-600 text-sm hover:underline mr-3" data-id="' + en.id + '">Edit</button>' +
                '<button class="en-del text-rose-500 text-sm hover:underline" data-id="' + en.id + '">Delete</button>' +
              '</div></div>';
          }).join('')
        : '<p class="text-sm text-slate-400 mb-2">No enumerators yet. Add the Anganwadi workers who collect surveys in this zone.</p>';
      var body =
        '<p class="text-sm text-slate-500 mb-3">Anganwadi workers who collect surveys in <b>' + ui.esc(zone.name) + '</b>. Each record selects one of these as its enumerator &mdash; recorded here, not re-typed per form.</p>' +
        rows +
        '<div class="mt-3 flex justify-between">' +
          '<button id="en-add" class="bg-indigo-600 text-white text-sm px-3.5 py-1.5 rounded-md hover:bg-indigo-700">+ Add Enumerator</button>' +
          '<button id="en-close" class="px-3.5 py-1.5 text-sm rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100">Close</button>' +
        '</div>';
      ui.modal({ title: 'Manage Enumerators', wide: true, hideFooter: true, bodyHtml: body });
      $('#en-add').on('click', function () { enumeratorFormModal(null); });
      $('#modal-body').on('click', '.en-edit', function () { enumeratorFormModal($(this).data('id')); });
      $('#modal-body').on('click', '.en-del', function () {
        var id = $(this).data('id');
        var used = store.where('beneficiaries', function (b) { return b.enumeratorId === id; }).length;
        if (used) { ui.toast('Cannot delete: ' + used + ' record(s) use this enumerator', 'error'); return; }
        var arr = (zone.enumerators || []).filter(function (e) { return e.id !== id; });
        store.update('zones', zone.id, { enumerators: arr });
        zone.enumerators = arr;
        ui.toast('Enumerator removed', 'success');
        enumeratorsModal();
      });
      $('#en-close').on('click', function () { $('#modal-overlay').remove(); list(); });
    }

    function enumeratorFormModal(id) {
      var en = id ? ((zone.enumerators || []).filter(function (e) { return e.id === id; })[0] || {}) : {};
      var body =
        ui.field('Name', ui.text('en_name', en.name), { required: true, name: 'en_name' }) +
        '<div class="grid md:grid-cols-2 gap-x-4">' +
          ui.field('AWC (Anganwadi Centre)', ui.text('en_awc', en.awc)) +
          ui.field('Project', ui.text('en_project', en.project)) +
          ui.field('District', ui.text('en_district', en.district)) +
          ui.field('Contact', ui.text('en_contact', en.contact, { type: 'tel', attrs: 'maxlength=10' })) +
        '</div>';
      ui.modal({
        title: (id ? 'Edit' : 'Add') + ' Enumerator', confirmText: 'Save', wide: true, bodyHtml: body,
        onConfirm: function () {
          var d = ui.collect($('#modal-body'));
          if (!(d.en_name || '').trim()) { ui.toast('Enumerator name is required', 'error'); return false; }
          var fields = {
            name: d.en_name.trim(), awc: (d.en_awc || '').trim(), project: (d.en_project || '').trim(),
            district: (d.en_district || '').trim(), contact: (d.en_contact || '').trim()
          };
          var arr = (zone.enumerators || []).slice();
          if (id) {
            arr = arr.map(function (e) { return e.id === id ? Object.assign({}, e, fields) : e; });
          } else {
            fields.id = store.uid('enum');
            arr.push(fields);
          }
          store.update('zones', zone.id, { enumerators: arr });
          zone.enumerators = arr;
          ui.toast('Enumerator saved', 'success');
          enumeratorsModal();   // reopen the manage list (replaces this modal)
          return false;          // keep the reopened list open
        }
      });
    }

    function miniStat(label, val, cls) {
      return '<div class="bg-white border rounded-xl p-3 text-center"><div class="text-xl font-bold ' + cls + '">' + val + '</div><div class="text-[11px] text-slate-400">' + label + '</div></div>';
    }
    function filterChip(f, label) {
      return '<button class="filter-chip px-2.5 py-1 rounded-full text-xs ' + (f === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600') + '" data-f="' + f + '">' + label + '</button>';
    }
  }
});
