/* SDMIS — Reports: multi-criteria filters, stats, CSV/print export */
window.SDMIS = window.SDMIS || {};

SDMIS.router.register('reports', {
  roles: ['hq'],
  title: 'Reports',
  render: function ($c) {
    var store = SDMIS.store, ui = SDMIS.ui, C = SDMIS.constants;
    var zones = store.all('zones');
    var all = store.all('beneficiaries');

    function distinct(getter) {
      var set = {};
      all.forEach(function (r) { var v = getter(r); if (v) set[v] = true; });
      return Object.keys(set).sort();
    }

    function disabilityOf(r) {
      return r.formType === 'A' ? (r.step4A && r.step4A.disabilityType) : (r.step4B && r.step4B.suspectedDisabilityType);
    }
    function pensionOf(r) {
      var s = r.formType === 'A' ? r.step4A : r.step4B;
      return s ? s.pensionStatus : '';
    }
    function ageGroupOf(r) {
      var a = parseInt(r.step1.age, 10);
      if (isNaN(a)) return '';
      var g = C.ageGroups.filter(function (x) { return a >= x.min && a <= x.max; })[0];
      return g ? g.value : '';
    }

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
          fSelect('zoneId', 'Zone', zones.map(function (z) { return { value: z.id, label: z.name }; })) +
          fSelect('gpu', 'GPU', distinct(function (r) { return r.gpu; })) +
          fSelect('ward', 'Ward', distinct(function (r) { return r.ward; })) +
          fSelect('gender', 'Gender', C.gender) +
          fSelect('ageGroup', 'Age Group', C.ageGroups) +
          fSelect('disability', 'Disability Type', C.disabilityType) +
          fSelect('education', 'Education', C.education) +
          fSelect('occupation', 'Occupation', C.occupation) +
          fSelect('annualIncome', 'Annual Income', C.annualIncome) +
          fSelect('houseType', 'House Type', C.houseType) +
          fSelect('maritalStatus', 'Marital Status', C.maritalStatus) +
          fSelect('residency', 'Local / Non-Local', C.residency) +
          fSelect('pensionStatus', 'Pension Status', C.pensionStatus) +
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
        if (f.zoneId && r.zoneId !== f.zoneId) return false;
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
        if (f.status && r.status !== f.status) return false;
        if (f.name && (r.step1.name || '').toLowerCase().indexOf(f.name) === -1) return false;
        return true;
      });
    }

    function zoneName(id) { var z = store.find('zones', id); return z ? z.name : '—'; }
    function surveyPeriod(id) { var s = id ? store.find('surveys', id) : null; return s ? s.period : '—'; }

    var lastRows = [];
    var PER = 15;

    function renderOutput(list) {
      lastRows = list;
      // breakdown stats
      var byZone = {}, byDis = {}, byGender = {}, byForm = { A: 0, B: 0 };
      list.forEach(function (r) {
        byZone[zoneName(r.zoneId)] = (byZone[zoneName(r.zoneId)] || 0) + 1;
        var d = disabilityOf(r); if (d) byDis[d] = (byDis[d] || 0) + 1;
        byGender[r.step1.gender || 'Unknown'] = (byGender[r.step1.gender || 'Unknown'] || 0) + 1;
        byForm[r.formType]++;
      });

      function statTable(title, obj) {
        var rows = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; }).map(function (k) {
          return '<tr class="border-b border-slate-100"><td class="py-1 text-slate-600">' + ui.esc(k) + '</td><td class="py-1 text-right font-medium text-slate-700">' + obj[k] + '</td></tr>';
        }).join('');
        return '<div class="bg-white border rounded-xl shadow-sm p-4"><h4 class="text-sm font-semibold text-slate-700 mb-2">' + title + '</h4>' +
          '<table class="w-full text-sm">' + (rows || '<tr><td class="text-slate-400 py-2">No data</td></tr>') + '</table></div>';
      }

      $('#report-output').html(
        '<div id="print-area">' +
          '<div class="hidden print:block mb-3"><h2 class="text-lg font-bold">SDMIS — Beneficiary Report</h2><p class="text-xs">Generated ' + new Date().toLocaleString() + '</p></div>' +
          '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">' +
            '<div class="bg-indigo-600 text-white rounded-xl p-4"><div class="text-2xl font-bold">' + list.length + '</div><div class="text-xs opacity-80">Matching Records</div></div>' +
            '<div class="bg-white border rounded-xl p-4"><div class="text-2xl font-bold text-emerald-600">' + byForm.A + '</div><div class="text-xs text-slate-400">Form A (Certified)</div></div>' +
            '<div class="bg-white border rounded-xl p-4"><div class="text-2xl font-bold text-amber-600">' + byForm.B + '</div><div class="text-xs text-slate-400">Form B (Suspected)</div></div>' +
            '<div class="bg-white border rounded-xl p-4"><div class="text-2xl font-bold text-slate-700">' + Object.keys(byZone).length + '</div><div class="text-xs text-slate-400">Zones Covered</div></div>' +
          '</div>' +
          '<div class="grid md:grid-cols-3 gap-4 mb-5">' +
            statTable('Zone-wise', byZone) + statTable('Disability-wise', byDis) + statTable('Gender-wise', byGender) +
          '</div>' +
          '<div class="bg-white border rounded-xl shadow-sm">' +
            '<div class="px-4 py-3 border-b font-medium text-slate-700 text-sm">Detailed Beneficiary List</div>' +
            '<div class="overflow-x-auto"><table class="w-full"><thead><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
              '<th class="px-2 py-2">#</th><th class="px-2 py-2">Name</th><th class="px-2 py-2">Form</th><th class="px-2 py-2">Survey</th><th class="px-2 py-2">Zone</th><th class="px-2 py-2">GPU</th><th class="px-2 py-2">Age/Gender</th><th class="px-2 py-2">Disability</th><th class="px-2 py-2">Status</th>' +
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
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc(zoneName(r.zoneId)) + '</td>' +
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc(r.gpu || '—') + '</td>' +
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc((r.step1.age || '—') + '/' + (r.step1.gender || '—')) + '</td>' +
            '<td class="px-2 py-1.5 text-sm text-slate-500">' + ui.esc(disabilityOf(r) || '—') + '</td>' +
            '<td class="px-2 py-1.5">' + ui.statusBadge(r.status) + '</td>' +
          '</tr>';
        }).join('');
        $('#rep-rows').html(rows || '<tr><td colspan="9">' + ui.emptyState('No records match the selected filters') + '</td></tr>');
        ui.renderPager($('#rep-pager'), meta, function (p) { page = p; drawTable(); });
      }
      drawTable();
    }

    function exportCsv() {
      if (!lastRows.length) { ui.toast('No records to export', 'warn'); return; }
      var headers = ['Name', 'Form', 'Survey', 'Zone', 'GPU', 'Ward', 'Age', 'Gender', 'Disability', 'Education', 'Occupation', 'Annual Income', 'House Type', 'Residency', 'Status', 'Enumerator'];
      var lines = [headers.join(',')];
      lastRows.forEach(function (r) {
        var zoneRec = store.find('zones', r.zoneId);
        var ens = (zoneRec && zoneRec.enumerators) || [];
        var en = ens.filter(function (e) { return e.id === r.enumeratorId; })[0] || {};
        var row = [
          r.step1.name, r.formType, surveyPeriod(r.surveyId), zoneName(r.zoneId), r.gpu, r.ward, r.step1.age, r.step1.gender,
          disabilityOf(r), r.step2.education, r.step2.occupation, r.step2.annualIncome, r.step3.houseType,
          r.step1.residency, C.statuses[r.status], en.name
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

    $('#apply-filters').on('click', function () { renderOutput(applyFilters(getFilters())); });
    $('#search-name').on('keydown', function (e) { if (e.key === 'Enter') renderOutput(applyFilters(getFilters())); });
    $('#reset-filters').on('click', function () { $('#filter-grid select').val(''); $('#search-name').val(''); renderOutput(all); });
    $('#export-csv').on('click', exportCsv);
    $('#print-pdf').on('click', function () { window.print(); });

    // initial render with all records
    renderOutput(all);
  }
});
