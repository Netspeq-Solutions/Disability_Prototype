/* SDMIS — SWO: verification queue, approve/return, Form B → Form A conversion */
window.SDMIS = window.SDMIS || {};

SDMIS.router.register('swo', {
  roles: ['swo'],
  title: 'Verification',
  render: function ($c, params) {
    var store = SDMIS.store, ui = SDMIS.ui, C = SDMIS.constants;
    var auth = SDMIS.auth;
    var user = auth.current();
    var district = auth.currentDistrict();   // the district this SWO verifies
    var PER = 10;
    var ENABLE_CONVERT = false; // Form B → Form A conversion is hidden for now

    if (params[0] === 'review' && params[1]) {
      var rec = store.find('beneficiaries', params[1]);
      if (rec) return review(rec);
    }
    if (params[0] === 'edit' && params[1]) {
      var erec = store.find('beneficiaries', params[1]);
      if (erec && district && erec.step1 && erec.step1.district === district) return editRecord(erec);
    }
    return list();

    // SWOs may correct submitted application details when required (req #6).
    // Re-uses the same data-entry sheet the inspector fills; on save it returns to review.
    function editRecord(rec) {
      // address dropdowns limited to the SWO's district; enumerators come from the record's inspector
      var blockObjs = store.blocksInDistrict(district);
      var creator = rec.createdBy ? store.find('officials', rec.createdBy) : null;
      SDMIS.formWizard.open($c, {
        record: rec, blocks: blockObjs, enumerators: (creator && creator.enumerators) || [],
        afterSave: function (saved) {
          store.audit('swo-edit', saved.id, 'Details corrected by SWO');
          ui.toast('Application details updated', 'success');
          SDMIS.router.go('#/swo/review/' + saved.id);
        },
        onCancel: function () { SDMIS.router.go('#/swo/review/' + rec.id); }
      });
    }

    function districtRecords() {
      return store.where('beneficiaries', function (b) { return district && b.step1 && b.step1.district === district; })
        .sort(function (a, b) { return (b.createdAt || '').localeCompare(a.createdAt || ''); });
    }
    function surveyName(id) { var s = id ? store.find('surveys', id) : null; return s ? s.period : '—'; }

    function list() {
      var recs = districtRecords();
      var counts = {
        submitted: recs.filter(function (r) { return r.status === 'submitted'; }).length,
        approved: recs.filter(function (r) { return r.status === 'approved'; }).length,
        returned: recs.filter(function (r) { return r.status === 'returned'; }).length
      };
      var surveys = store.all('surveys').slice().sort(function (a, b) { return (b.period || '').localeCompare(a.period || ''); });

      var statusTab = 'submitted', page = 1;

      $c.html(
        '<div class="grid grid-cols-3 gap-4 mb-5">' +
          card('Pending Verification', counts.submitted, 'bg-amber-50 text-amber-700') +
          card('Approved', counts.approved, 'bg-emerald-50 text-emerald-700') +
          card('Returned', counts.returned, 'bg-rose-50 text-rose-700') +
        '</div>' +
        '<div class="bg-white rounded-xl border shadow-sm">' +
          '<div class="border-b px-3 flex gap-1 overflow-x-auto">' +
            tabBtn('submitted', 'Pending') + tabBtn('approved', 'Approved') + tabBtn('returned', 'Returned') + tabBtn('all', 'All') +
          '</div>' +
          '<div class="p-3 border-b flex flex-wrap gap-2 items-center">' +
            '<input id="swo-search" placeholder="Search beneficiary..." class="' + ui.inputCls + ' w-full sm:max-w-xs">' +
            ui.select('swo-form', [{ value: 'A', label: 'Form A' }, { value: 'B', label: 'Form B' }], '', { placeholder: 'All forms' }).replace(ui.inputCls, ui.inputCls + ' w-full sm:w-36') +
            ui.select('swo-survey', surveys.map(function (s) { return { value: s.id, label: s.period }; }), '', { placeholder: 'All surveys' }).replace(ui.inputCls, ui.inputCls + ' w-full sm:w-40') +
          '</div>' +
          '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
            '<th class="px-3 py-2">Beneficiary</th><th class="px-3 py-2">Form</th><th class="px-3 py-2">Survey</th><th class="px-3 py-2">Block · Ward</th><th class="px-3 py-2">Age/Gender</th><th class="px-3 py-2">Status</th><th></th>' +
          '</tr></thead><tbody id="swo-rows"></tbody></table></div>' +
          '<div id="swo-pager"></div>' +
        '</div>'
      );

      function draw() {
        var q = ($('#swo-search').val() || '').toLowerCase();
        var formF = $('#swo-form').val();
        var surveyF = $('#swo-survey').val();
        var filtered = recs.filter(function (r) {
          if (statusTab !== 'all' && r.status !== statusTab) return false;
          if (formF && r.formType !== formF) return false;
          if (surveyF && r.surveyId !== surveyF) return false;
          if (q && (r.step1.name || '').toLowerCase().indexOf(q) === -1) return false;
          return true;
        });
        var meta = ui.pageSlice(filtered, page, PER);
        page = meta.page;
        var rows = meta.items.map(function (r) {
          // Convert → Form A is hidden for now (set ENABLE_CONVERT to re-enable)
          var convertBtn = (ENABLE_CONVERT && r.status === 'approved' && r.formType === 'B')
            ? '<button class="rec-convert text-purple-600 text-sm hover:underline ml-2" data-id="' + r.id + '">Convert → A</button>' : '';
          return '<tr class="border-b hover:bg-slate-50">' +
            '<td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(r.step1.name || '(no name)') + '</td>' +
            '<td class="px-3 py-2">' + (r.formType === 'A' ? ui.badge('A', 'bg-emerald-100 text-emerald-700') : ui.badge('B', 'bg-amber-100 text-amber-700')) + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + ui.esc(surveyName(r.surveyId)) + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + ui.esc((r.step1 && r.step1.block) || '—') + ' · ' + ui.esc(r.ward || '—') + '</td>' +
            '<td class="px-3 py-2 text-sm text-slate-500">' + ui.esc((r.step1.age || '—') + '/' + (r.step1.gender || '—')) + '</td>' +
            '<td class="px-3 py-2">' + ui.statusBadge(r.status) + '</td>' +
            '<td class="px-3 py-2 text-right whitespace-nowrap">' +
              '<button class="rec-review text-indigo-600 text-sm hover:underline" data-id="' + r.id + '">Review</button>' + convertBtn +
            '</td></tr>';
        }).join('');
        $('#swo-rows').html(rows || '<tr><td colspan="7">' + ui.emptyState('No records match.') + '</td></tr>');
        ui.renderPager($('#swo-pager'), meta, function (p) { page = p; draw(); });
      }

      $('.swo-tab').on('click', function () {
        statusTab = $(this).data('tab'); page = 1;
        $('.swo-tab').removeClass('border-indigo-600 text-indigo-600').addClass('border-transparent text-slate-500');
        $(this).removeClass('border-transparent text-slate-500').addClass('border-indigo-600 text-indigo-600');
        draw();
      });
      $('#swo-search').on('input', function () { page = 1; draw(); });
      $('#swo-form, #swo-survey').on('change', function () { page = 1; draw(); });
      $c.on('click', '.rec-review', function () { SDMIS.router.go('#/swo/review/' + $(this).data('id')); });
      $c.on('click', '.rec-convert', function () { convertModal($(this).data('id')); });
      draw();
    }

    function tabBtn(id, label) {
      var active = id === 'submitted';
      return '<button class="swo-tab px-4 py-2.5 text-sm font-medium border-b-2 ' +
        (active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700') +
        '" data-tab="' + id + '">' + label + '</button>';
    }

    function card(label, val, cls) {
      return '<div class="bg-white border rounded-xl shadow-sm p-4"><div class="text-2xl font-bold text-slate-800">' + val + '</div>' +
        '<div class="text-xs ' + cls + ' inline-block px-2 py-0.5 rounded mt-1">' + label + '</div></div>';
    }

    // ---------- review detail ----------
    function review(rec) {
      var inspector = store.find('officials', rec.createdBy);
      var actionBar = rec.status === 'submitted'
        ? '<div class="flex flex-wrap gap-2">' +
            '<button id="btn-edit" class="px-4 py-2 text-sm rounded-md border border-indigo-300 text-indigo-600 hover:bg-indigo-50">✎ Edit Details</button>' +
            '<button id="btn-return" class="px-4 py-2 text-sm rounded-md border border-rose-300 text-rose-600 hover:bg-rose-50">↩ Return for Correction</button>' +
            '<button id="btn-approve" class="px-4 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700">✓ Approve</button>' +
          '</div>'
        : (ENABLE_CONVERT && rec.status === 'approved' && rec.formType === 'B'
            ? '<button id="btn-convert" class="px-4 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700">Convert → Form A</button>'
            : '');

      var docCount = SDMIS.formWizard.recordImages(rec).length;

      $c.html(
        '<div class="max-w-5xl mx-auto">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<button id="back" class="text-sm text-slate-500 hover:text-slate-800">&larr; Back to queue</button>' +
            ui.statusBadge(rec.status) +
          '</div>' +
          '<div class="bg-white rounded-xl border shadow-sm">' +
            '<div class="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">' +
              '<div><h2 class="text-lg font-semibold text-slate-800">' + ui.esc(rec.step1.name || 'Unnamed') + '</h2>' +
              '<p class="text-xs text-slate-400">Entered by ' + ui.esc(inspector ? inspector.name : '—') + ' · ' + (rec.formType === 'A' ? 'Form A (Certified)' : 'Form B (Suspected)') + '</p></div>' +
              actionBar +
            '</div>' +
            // mobile-only segmented toggle (side-by-side panes on lg+)
            '<div class="lg:hidden flex border-b bg-slate-50 p-1 gap-1">' +
              '<button id="rv-tab-data" class="rv-tab flex-1 text-sm py-1.5 rounded-md bg-white shadow-sm font-medium text-indigo-600">Details</button>' +
              '<button id="rv-tab-docs" class="rv-tab flex-1 text-sm py-1.5 rounded-md text-slate-500">Documents' + (docCount ? ' (' + docCount + ')' : '') + '</button>' +
            '</div>' +
            '<div class="grid lg:grid-cols-2 lg:divide-x">' +
              '<div id="pane-data" class="p-4 sm:p-6 lg:block">' + SDMIS.formWizard.readOnlyHtml(rec) + '</div>' +
              '<div id="pane-docs" class="hidden lg:block p-4 sm:p-6 bg-slate-50/60">' +
                '<h4 class="text-sm font-semibold text-indigo-600 mb-3 uppercase tracking-wide flex items-center justify-between gap-2">' +
                  '<span>Uploaded Documents</span>' +
                  (docCount ? '<span class="text-[11px] font-normal text-slate-400 normal-case tracking-normal">Tap an image to enlarge</span>' : '') +
                '</h4>' +
                SDMIS.formWizard.documentsHtml(rec) +
              '</div>' +
            '</div>' +
          '</div></div>'
      );

      function setReviewTab(which) {
        var data = which === 'data';
        $('#pane-data').toggleClass('hidden', !data);
        $('#pane-docs').toggleClass('hidden', data);
        $('#rv-tab-data').toggleClass('bg-white shadow-sm font-medium text-indigo-600', data).toggleClass('text-slate-500', !data);
        $('#rv-tab-docs').toggleClass('bg-white shadow-sm font-medium text-indigo-600', !data).toggleClass('text-slate-500', data);
      }
      $('#rv-tab-data').on('click', function () { setReviewTab('data'); });
      $('#rv-tab-docs').on('click', function () { setReviewTab('docs'); });
      $('#pane-docs').on('click', '.doc-thumb', function () {
        ui.lightbox(SDMIS.formWizard.recordImages(rec), parseInt($(this).data('idx'), 10) || 0);
      });

      $('#back').on('click', function () { SDMIS.router.go('#/swo'); });

      $('#btn-edit').on('click', function () { SDMIS.router.go('#/swo/edit/' + rec.id); });

      $('#btn-approve').on('click', function () {
        store.update('beneficiaries', rec.id, { status: 'approved', reviewedBy: user.id });
        store.audit('approve', rec.id, 'Approved by SWO');
        ui.toast('Record approved', 'success');
        SDMIS.router.go('#/swo');
      });

      $('#btn-return').on('click', function () {
        ui.modal({
          title: 'Return for Correction', confirmText: 'Return',
          bodyHtml: ui.field('Remarks to Inspector', ui.textarea('remark', '', { rows: 3, placeholder: 'Describe what needs correction...' }), { required: true, name: 'remark' }),
          onConfirm: function () {
            var remark = $('#modal-body [name=remark]').val().trim();
            if (!remark) { ui.toast('Please enter remarks', 'error'); return false; }
            store.update('beneficiaries', rec.id, { status: 'returned', reviewedBy: user.id, returnRemark: remark });
            store.audit('return', rec.id, remark);
            ui.toast('Record returned to inspector', 'warn');
            SDMIS.router.go('#/swo');
          }
        });
      });

      $('#btn-convert').on('click', function () { convertModal(rec.id); });
    }

    // ---------- Form B → Form A conversion ----------
    function convertModal(id) {
      var rec = store.find('beneficiaries', id);
      if (!rec || rec.formType !== 'B') return;
      var body =
        '<p class="text-sm text-slate-500 mb-3">Enter the certified disability details. Steps 1–3 (Personal, Qualification, Family) will be carried over automatically.</p>' +
        ui.field('Disability Type', ui.select('disabilityType', store.master('disabilityType'), rec.step4B.suspectedDisabilityType), { required: true, name: 'disabilityType' }) +
        ui.field('Disability Percentage (%)', ui.text('disabilityPercent', '', { type: 'number', attrs: 'min=0 max=100' }), { name: 'disabilityPercent' }) +
        ui.field('Certificate Type', ui.select('certType', C.certificateTypes, ''), { required: true, name: 'certType' }) +
        ui.field('UDID Number', ui.text('udid', '', { attrs: 'inputmode="numeric" maxlength=18' }), { name: 'udid', hint: '18 digits — required for a Permanent certificate' }) +
        ui.field('Valid Till', ui.text('validTill', '', { type: 'date' }), { name: 'validTill', hint: 'Required for a Temporary certificate' }) +
        ui.field('Certificate Issue Date', ui.text('issueDate', '', { type: 'date' }), { name: 'issueDate' }) +
        ui.field('Place of Issue', ui.text('issuePlace', ''), { name: 'issuePlace' });

      ui.modal({
        title: 'Convert Form B → Form A', confirmText: 'Convert', wide: true, bodyHtml: body,
        onConfirm: function () {
          var d = ui.collect($('#modal-body'));
          if (!d.disabilityType || !d.certType) {
            ui.toast('Disability Type and Certificate Type are required', 'error');
            return false;
          }
          if (d.certType === 'Permanent') {
            if (!String(d.udid || '').trim()) { ui.toast('UDID is required for a Permanent certificate', 'error'); return false; }
            if (d.udid.length !== 18) { ui.toast('UDID must be 18 digits', 'error'); return false; }
          }
          if (d.certType === 'Temporary' && !String(d.validTill || '').trim()) { ui.toast('Valid Till date is required for a Temporary certificate', 'error'); return false; }

          // build the new Form A record, retaining steps 1-3
          var newRec = JSON.parse(JSON.stringify(rec));
          newRec.id = store.uid('ben');
          newRec.formType = 'A';
          newRec.convertedFrom = rec.id;
          newRec.status = 'approved';
          newRec.reviewedBy = user.id;
          newRec.createdAt = new Date().toISOString();
          newRec.step4B = null;
          newRec.step4A = {
            disabilityType: d.disabilityType, disabilityOther: '',
            disabilityPercent: d.disabilityPercent, certType: d.certType, certImage: '',
            validTill: d.certType === 'Temporary' ? (d.validTill || '') : '',
            udid: d.certType === 'Permanent' ? (d.udid || '') : '', issueDate: d.issueDate || '', issuePlace: d.issuePlace || '',
            aids: (rec.step4B && rec.step4B.aids) || [], aidsOther: (rec.step4B && rec.step4B.aidsOther) || '',
            benefits: (rec.step4B && rec.step4B.benefits) || [],
            pensionStatus: (rec.step4B && rec.step4B.pensionStatus) || '',
            pensionSchemes: (rec.step4B && rec.step4B.pensionSchemes) || [],
            pensionSince: (rec.step4B && rec.step4B.pensionSince) || '',
            medicalProblems: (rec.step4B && rec.step4B.medicalProblems) || '',
            medicalSince: (rec.step4B && rec.step4B.medicalSince) || '',
            services: (rec.step4B && rec.step4B.services) || [],
            caregiverPresent: (rec.step4B && rec.step4B.caregiverPresent) || '',
            caregiverType: (rec.step4B && rec.step4B.caregiverType) || '',
            caregiverName: (rec.step4B && rec.step4B.caregiverName) || '',
            caregiverSalary: (rec.step4B && rec.step4B.caregiverSalary) || '',
            caregiverRelation: (rec.step4B && rec.step4B.caregiverRelation) || ''
          };
          store.insert('beneficiaries', newRec);
          // remove the old Form B from active records
          store.remove('beneficiaries', rec.id);
          store.audit('convert', newRec.id, 'Converted from Form B (' + rec.id + ') to Form A');
          ui.toast('Converted to Form A — now a Certified Disability Case', 'success');
          SDMIS.router.go('#/swo');
        }
      });
    }
  }
});
