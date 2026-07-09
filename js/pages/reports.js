/* SDMIS — Reports: a main filterable report + named deterministic sub-reports */
window.SDMIS = window.SDMIS || {};

SDMIS.router.register('reports', {
  roles: ['hq'],
  title: 'Reports',
  render: function ($c, params) {
    var store = SDMIS.store, ui = SDMIS.ui, C = SDMIS.constants;
    var all = store.all('beneficiaries');

    // ---- field accessors ----
    function distinct(getter) {
      var set = {};
      all.forEach(function (r) { var v = getter(r); if (v) set[v] = true; });
      return Object.keys(set).sort();
    }
    function disabilityOf(r) {
      return r.formType === 'A' ? (r.step4A && r.step4A.disabilityType) : (r.step4B && r.step4B.suspectedDisabilityType);
    }
    function step4Of(r) { return r.formType === 'A' ? r.step4A : r.step4B; }
    function pensionOf(r) { var s = step4Of(r); return s ? s.pensionStatus : ''; }
    function caregiverOf(r) { var s = step4Of(r); return (s && s.caregiverPresent) || ''; }
    function caregiverTypeOf(r) { var s = step4Of(r); return (s && s.caregiverType) || ''; }
    function servicesOf(r) { var s = step4Of(r); return (s && s.services) || []; }
    function schemesOf(r) { var s = step4Of(r); return (s && s.pensionSchemes) || []; }
    function ageGroupOf(r) {
      var a = parseInt(r.step1.age, 10);
      if (isNaN(a)) return '';
      var g = C.ageGroups.filter(function (x) { return a >= x.min && a <= x.max; })[0];
      return g ? g.value : '';
    }
    function districtOf(r) { return (r.step1 && r.step1.district) || '—'; }
    function blockOf(r) { return (r.step1 && r.step1.block) || '—'; }
    function surveyPeriod(id) { var s = id ? store.find('surveys', id) : null; return s ? s.period : '—'; }

    function tally(list, getter) {
      var o = {}; list.forEach(function (r) { var v = getter(r); if (v) o[v] = (o[v] || 0) + 1; }); return o;
    }
    function tallyFlat(list, getter) {
      var o = {}; list.forEach(function (r) { (getter(r) || []).forEach(function (v) { if (v) o[v] = (o[v] || 0) + 1; }); }); return o;
    }

    // ---- deterministic sub-reports (each is its own sidebar menu under Reports) ----
    var PRESETS = [
      {
        id: 'caregiver', name: 'Caregiver Coverage Report',
        desc: 'Beneficiaries who have a caregiver, broken down by caregiver type and district.',
        predicate: function (r) { return caregiverOf(r) === 'Yes'; },
        breakdowns: function (list) {
          return [
            { title: 'By Caregiver Type', obj: tally(list, caregiverTypeOf) },
            { title: 'By District', obj: tally(list, districtOf) }
          ];
        }
      },
      {
        id: 'salaried', name: 'Salaried Caregivers Report',
        desc: 'Hired / Professional caregivers where a salary or fee is paid.',
        predicate: function (r) { var t = caregiverTypeOf(r); return caregiverOf(r) === 'Yes' && (t === 'Hired' || t === 'Professional'); },
        breakdowns: function (list) {
          return [
            { title: 'By Caregiver Type', obj: tally(list, caregiverTypeOf) },
            { title: 'By District', obj: tally(list, districtOf) }
          ];
        }
      },
      {
        id: 'pension', name: 'Pension Scheme Enrolment Report',
        desc: 'Pension recipients, broken down by scheme and district.',
        predicate: function (r) { return pensionOf(r) === 'Yes'; },
        breakdowns: function (list) {
          return [
            { title: 'By Pension Scheme', obj: tallyFlat(list, schemesOf) },
            { title: 'By District', obj: tally(list, districtOf) }
          ];
        }
      },
      {
        id: 'services', name: 'Services Utilisation Report',
        desc: 'Beneficiaries receiving one or more services, by service type and district.',
        predicate: function (r) { return servicesOf(r).length > 0; },
        breakdowns: function (list) {
          return [
            { title: 'By Service', obj: tallyFlat(list, servicesOf) },
            { title: 'By District', obj: tally(list, districtOf) }
          ];
        }
      }
    ];

    var lastRows = [];
    var PER = 15;

    // ---- shared output renderer (stats + breakdowns + detail table) ----
    function renderOutput(list, opts) {
      opts = opts || {};
      lastRows = list;
      var byDistrict = {}, byForm = { A: 0, B: 0 };
      list.forEach(function (r) {
        byDistrict[districtOf(r)] = (byDistrict[districtOf(r)] || 0) + 1;
        byForm[r.formType]++;
      });

      function statTable(title, obj) {
        var rows = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).map(function (k) {
          return '<tr class="border-b border-slate-100"><td class="py-1 text-slate-600">' + ui.esc(k) + '</td><td class="py-1 text-right font-medium text-slate-700">' + obj[k] + '</td></tr>';
        }).join('');
        return '<div class="bg-white border rounded-xl shadow-sm p-4"><h4 class="text-sm font-semibold text-slate-700 mb-2">' + ui.esc(title) + '</h4>' +
          '<table class="w-full text-sm">' + (rows || '<tr><td class="text-slate-400 py-2">No data</td></tr>') + '</table></div>';
      }

      // breakdown tables: report-supplied, else default (zone / disability / gender)
      var breakdowns = opts.breakdowns;
      if (!breakdowns) {
        var byDis = {}, byGender = {};
        list.forEach(function (r) {
          var d = disabilityOf(r); if (d) byDis[d] = (byDis[d] || 0) + 1;
          byGender[r.step1.gender || 'Unknown'] = (byGender[r.step1.gender || 'Unknown'] || 0) + 1;
        });
        breakdowns = [{ title: 'District-wise', obj: byDistrict }, { title: 'Disability-wise', obj: byDis }, { title: 'Gender-wise', obj: byGender }];
      }
      var reportBanner = opts.title
        ? '<div class="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 mb-5"><h3 class="font-semibold text-indigo-800 text-sm">' + ui.esc(opts.title) + '</h3>' +
            (opts.desc ? '<p class="text-xs text-indigo-600 mt-0.5">' + ui.esc(opts.desc) + '</p>' : '') + '</div>'
        : '';

      $('#report-output').html(
        '<div id="print-area">' +
          '<div class="hidden print:block mb-3"><h2 class="text-lg font-bold">SDMIS — ' + ui.esc(opts.title || 'Beneficiary Report') + '</h2><p class="text-xs">Generated ' + new Date().toLocaleString() + '</p></div>' +
          reportBanner +
          '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">' +
            '<div class="bg-indigo-600 text-white rounded-xl p-4"><div class="text-2xl font-bold">' + list.length + '</div><div class="text-xs opacity-80">Matching Records</div></div>' +
            '<div class="bg-white border rounded-xl p-4"><div class="text-2xl font-bold text-emerald-600">' + byForm.A + '</div><div class="text-xs text-slate-400">Form A (Certified)</div></div>' +
            '<div class="bg-white border rounded-xl p-4"><div class="text-2xl font-bold text-amber-600">' + byForm.B + '</div><div class="text-xs text-slate-400">Form B (Suspected)</div></div>' +
            '<div class="bg-white border rounded-xl p-4"><div class="text-2xl font-bold text-slate-700">' + Object.keys(byDistrict).length + '</div><div class="text-xs text-slate-400">Districts Covered</div></div>' +
          '</div>' +
          '<div class="grid md:grid-cols-3 gap-4 mb-5">' +
            breakdowns.map(function (b) { return statTable(b.title, b.obj); }).join('') +
          '</div>' +
          '<div class="bg-white border rounded-xl shadow-sm">' +
            '<div class="px-4 py-3 border-b font-medium text-slate-700 text-sm">Detailed Beneficiary List</div>' +
            '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
              '<th class="px-2 py-2">#</th><th class="px-2 py-2">Name</th><th class="px-2 py-2">Form</th><th class="px-2 py-2">Survey</th><th class="px-2 py-2">District</th><th class="px-2 py-2">Block</th><th class="px-2 py-2">Age/Gender</th><th class="px-2 py-2">Disability</th><th class="px-2 py-2">Status</th>' +
            '</tr></thead><tbody id="rep-rows"></tbody></table></div>' +
            '<div id="rep-pager" class="no-print"></div>' +
          '</div>' +
        '</div>'
      );

      var page = 1;
      function drawTable() {
        var meta = ui.pageSlice(list, page, PER);
        page = meta.page;
        var rows = meta.items.map(function (r, i) {
          return '<tr class="border-b hover:bg-slate-50">' +
            '<td class="px-2 py-1.5 text-xs text-slate-400">' + (meta.start + i + 1) + '</td>' +
            '<td class="px-2 py-1.5 text-sm font-medium text-slate-700">' + ui.esc(r.step1.name || '—') + '</td>' +
            '<td class="px-2 py-1.5">' + (r.formType === 'A' ? ui.badge('A', 'bg-emerald-100 text-emerald-700') : ui.badge('B', 'bg-amber-100 text-amber-700')) + '</td>' +
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc(surveyPeriod(r.surveyId)) + '</td>' +
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc(districtOf(r)) + '</td>' +
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc(blockOf(r)) + '</td>' +
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc((r.step1.age || '—') + '/' + (r.step1.gender || '—')) + '</td>' +
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc(disabilityOf(r) || '—') + '</td>' +
            '<td class="px-2 py-1.5">' + ui.statusBadge(r.status) + '</td>' +
          '</tr>';
        }).join('');
        $('#rep-rows').html(rows || '<tr><td colspan="9">' + ui.emptyState('No records match') + '</td></tr>');
        ui.renderPager($('#rep-pager'), meta, function (p) { page = p; drawTable(); });
      }
      drawTable();
    }

    function exportCsv() {
      if (!lastRows.length) { ui.toast('No records to export', 'warn'); return; }
      var headers = ['Name', 'Form', 'Survey', 'District', 'Block', 'GPU', 'Ward', 'Age', 'Gender', 'Disability',
        'Certificate Type', 'Valid Till', 'Education', 'Occupation', 'Annual Income', 'House Type', 'Residency',
        'Pension', 'Pension Schemes', 'Services', 'Caregiver', 'Caregiver Type', 'Caregiver Salary/Fee', 'Other Benefits', 'Status', 'Enumerator'];
      var lines = [headers.join(',')];
      lastRows.forEach(function (r) {
        var creator = r.createdBy ? store.find('officials', r.createdBy) : null;
        var ens = (creator && creator.enumerators) || [];
        var en = ens.filter(function (e) { return e.id === r.enumeratorId; })[0] || {};
        var s4 = step4Of(r) || {};
        var row = [
          r.step1.name, r.formType, surveyPeriod(r.surveyId), districtOf(r), blockOf(r), r.gpu, r.ward, r.step1.age, r.step1.gender,
          disabilityOf(r),
          (r.formType === 'A' ? (s4.certType || '') : ''), (r.formType === 'A' ? (s4.validTill || '') : ''),
          r.step2.education, r.step2.occupation, r.step2.annualIncome, r.step3.houseType,
          (r.step1.residency === 'local' ? 'Local' : (r.step1.residency ? 'Others' : '')),
          pensionOf(r), schemesOf(r).join('; '), servicesOf(r).join('; '), caregiverOf(r), caregiverTypeOf(r), s4.caregiverSalary,
          (s4.benefits || []).join('; '),
          C.statuses[r.status], en.name
        ].map(function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; });
        lines.push(row.join(','));
      });
      var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sdmis_report_' + Date.now() + '.csv';
      a.click();
      ui.toast('CSV exported (' + lastRows.length + ' records)', 'success');
    }

    // ---- a named deterministic sub-report (no filters; canned predicate + breakdowns) ----
    function renderPresetReport(def) {
      $('#page-title').text(def.name);
      var list = all.filter(def.predicate);
      $c.html(
        '<div class="bg-white border rounded-xl shadow-sm p-4 mb-5 no-print flex flex-wrap items-center justify-between gap-3">' +
          '<div><h3 class="font-semibold text-slate-700 text-sm">' + ui.esc(def.name) + '</h3>' +
            '<p class="text-xs text-slate-400 mt-0.5">' + ui.esc(def.desc) + '</p></div>' +
          '<div class="flex gap-2">' +
            '<button id="export-csv" class="border border-slate-300 text-slate-600 text-sm px-4 py-1.5 rounded-md hover:bg-slate-50">⬇ Export CSV</button>' +
            '<button id="print-pdf" class="border border-slate-300 text-slate-600 text-sm px-4 py-1.5 rounded-md hover:bg-slate-50">🖨 Print / PDF</button>' +
          '</div>' +
        '</div>' +
        '<div id="report-output"></div>'
      );
      renderOutput(list, { title: def.name, desc: def.desc, breakdowns: def.breakdowns(list) });
      $('#export-csv').on('click', exportCsv);
      $('#print-pdf').on('click', function () { window.print(); });
    }

    // ---- main filterable report ----
    function renderMainReport() {
      var sel = ui.inputCls + ' text-sm';
      function fSelect(name, label, options) {
        return '<div><label class="block text-[11px] font-medium text-slate-500 mb-0.5">' + label + '</label>' +
          ui.select(name, options, '', { placeholder: 'All' }).replace(ui.inputCls, sel) + '</div>';
      }

      $c.html(
        '<div class="bg-white border rounded-xl shadow-sm p-4 mb-5 no-print">' +
          '<div class="flex items-center justify-between mb-3"><h3 class="font-semibold text-slate-700 text-sm">Report Filters</h3>' +
            '<button id="reset-filters" class="text-xs text-slate-500 hover:text-indigo-600">Reset all</button></div>' +
          '<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3" id="filter-grid">' +
            fSelect('surveyId', 'Survey', store.all('surveys').map(function (s) { return { value: s.id, label: s.period }; })) +
            fSelect('formType', 'Form Type', [{ value: 'A', label: 'Form A (Certified)' }, { value: 'B', label: 'Form B (Suspected)' }]) +
            fSelect('district', 'District', distinct(function (r) { return r.step1.district; })) +
            fSelect('block', 'Block', distinct(function (r) { return r.step1.block; })) +
            fSelect('gpu', 'GPU', distinct(function (r) { return r.gpu; })) +
            fSelect('ward', 'Ward', distinct(function (r) { return r.ward; })) +
            fSelect('gender', 'Gender', C.gender) +
            fSelect('ageGroup', 'Age Group', C.ageGroups) +
            fSelect('disability', 'Disability Type', store.master('disabilityType')) +
            fSelect('education', 'Education', C.education) +
            fSelect('occupation', 'Occupation', C.occupation) +
            fSelect('annualIncome', 'Annual Income', C.annualIncome) +
            fSelect('houseType', 'House Type', C.houseType) +
            fSelect('maritalStatus', 'Marital Status', C.maritalStatus) +
            fSelect('residency', 'Residency (Local / Others)', C.residency) +
            fSelect('pensionStatus', 'Pension Status', C.pensionStatus) +
            fSelect('pensionScheme', 'Pension Scheme', store.master('pensionSchemes')) +
            fSelect('caregiver', 'Has Caregiver', C.pensionStatus) +
            fSelect('caregiverType', 'Caregiver Type', store.master('caregiverTypes')) +
            fSelect('service', 'Service Receiving', store.master('services')) +
            fSelect('status', 'Verification Status', Object.keys(C.statuses).map(function (k) { return { value: k, label: C.statuses[k] }; })) +
            '<div><label class="block text-[11px] font-medium text-slate-500 mb-0.5">Search Name</label><input id="search-name" class="' + sel + '" placeholder="Beneficiary..."></div>' +
          '</div>' +
          '<div class="flex gap-2 mt-4">' +
            '<button id="apply-filters" class="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-md hover:bg-indigo-700">Apply Filters</button>' +
            '<button id="export-csv" class="border border-slate-300 text-slate-600 text-sm px-4 py-1.5 rounded-md hover:bg-slate-50">⬇ Export CSV</button>' +
            '<button id="print-pdf" class="border border-slate-300 text-slate-600 text-sm px-4 py-1.5 rounded-md hover:bg-slate-50">🖨 Print / PDF</button>' +
          '</div>' +
        '</div>' +
        '<div id="report-output"></div>'
      );

      function getFilters() {
        var f = {};
        $('#filter-grid select').each(function () { var v = $(this).val(); if (v) f[$(this).attr('name')] = v; });
        f.name = ($('#search-name').val() || '').toLowerCase();
        return f;
      }

      function applyFilters(f) {
        return all.filter(function (r) {
          if (f.surveyId && r.surveyId !== f.surveyId) return false;
          if (f.formType && r.formType !== f.formType) return false;
          if (f.district && r.step1.district !== f.district) return false;
          if (f.block && r.step1.block !== f.block) return false;
          if (f.gpu && r.gpu !== f.gpu) return false;
          if (f.ward && r.ward !== f.ward) return false;
          if (f.gender && r.step1.gender !== f.gender) return false;
          if (f.ageGroup && ageGroupOf(r) !== f.ageGroup) return false;
          if (f.disability && disabilityOf(r) !== f.disability) return false;
          if (f.education && r.step2.education !== f.education) return false;
          if (f.occupation && r.step2.occupation !== f.occupation) return false;
          if (f.annualIncome && r.step2.annualIncome !== f.annualIncome) return false;
          if (f.houseType && r.step3.houseType !== f.houseType) return false;
          if (f.maritalStatus && r.step1.maritalStatus !== f.maritalStatus) return false;
          if (f.residency && r.step1.residency !== f.residency) return false;
          if (f.pensionStatus && pensionOf(r) !== f.pensionStatus) return false;
          if (f.pensionScheme && schemesOf(r).indexOf(f.pensionScheme) === -1) return false;
          if (f.caregiver && caregiverOf(r) !== f.caregiver) return false;
          if (f.caregiverType && caregiverTypeOf(r) !== f.caregiverType) return false;
          if (f.service && servicesOf(r).indexOf(f.service) === -1) return false;
          if (f.status && r.status !== f.status) return false;
          if (f.name && (r.step1.name || '').toLowerCase().indexOf(f.name) === -1) return false;
          return true;
        });
      }

      $('#apply-filters').on('click', function () { renderOutput(applyFilters(getFilters())); });
      $('#search-name').on('keydown', function (e) { if (e.key === 'Enter') renderOutput(applyFilters(getFilters())); });
      $('#reset-filters').on('click', function () { $('#filter-grid select').val(''); $('#search-name').val(''); renderOutput(all); });
      $('#export-csv').on('click', exportCsv);
      $('#print-pdf').on('click', function () { window.print(); });

      renderOutput(all); // initial render with all records
    }

    // ---- dispatch: /reports → main; /reports/<id> → named sub-report ----
    var presetId = params && params[0];
    var preset = PRESETS.filter(function (d) { return d.id === presetId; })[0];
    if (preset) renderPresetReport(preset);
    else renderMainReport();
  }
});
