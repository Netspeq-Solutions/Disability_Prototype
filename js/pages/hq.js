/* SDMIS — HQ: centralized monitoring dashboard */
window.SDMIS = window.SDMIS || {};

SDMIS.router.register('hq', {
  roles: ['hq'],
  title: 'Monitoring Dashboard',
  render: function ($c) {
    var store = SDMIS.store, ui = SDMIS.ui, C = SDMIS.constants;
    var recs = store.all('beneficiaries');
    var zones = store.all('zones');

    var byStatus = { draft: 0, submitted: 0, returned: 0, approved: 0 };
    var byForm = { A: 0, B: 0 };
    var byDisability = {};
    var byGender = {};
    recs.forEach(function (r) {
      byStatus[r.status]++;
      byForm[r.formType]++;
      var dt = r.formType === 'A' ? (r.step4A && r.step4A.disabilityType) : (r.step4B && r.step4B.suspectedDisabilityType);
      if (dt) byDisability[dt] = (byDisability[dt] || 0) + 1;
      var g = r.step1.gender || 'Unknown';
      byGender[g] = (byGender[g] || 0) + 1;
    });

    function bigStat(label, val, cls, sub) {
      return '<div class="bg-white border rounded-xl shadow-sm p-5">' +
        '<div class="text-3xl font-bold ' + (cls || 'text-slate-800') + '">' + val + '</div>' +
        '<div class="text-sm text-slate-500 mt-1">' + label + '</div>' +
        (sub ? '<div class="text-xs text-slate-400 mt-0.5">' + sub + '</div>' : '') + '</div>';
    }

    // bar list helper
    function barList(obj, colorFn) {
      var entries = Object.keys(obj).map(function (k) { return [k, obj[k]]; }).sort(function (a, b) { return b[1] - a[1]; });
      var max = entries.reduce(function (m, e) { return Math.max(m, e[1]); }, 1);
      if (!entries.length) return ui.emptyState('No data');
      return entries.map(function (e, i) {
        var pct = Math.round(e[1] / max * 100);
        return '<div class="mb-2"><div class="flex justify-between text-xs mb-0.5"><span class="text-slate-600">' + ui.esc(e[0]) + '</span><span class="text-slate-400">' + e[1] + '</span></div>' +
          '<div class="h-2 bg-slate-100 rounded-full overflow-hidden"><div class="stat-bar h-full rounded-full ' + (colorFn ? colorFn(i) : 'bg-indigo-500') + '" style="width:' + pct + '%"></div></div></div>';
      }).join('');
    }

    // zone progress (records entered per zone, % submitted+approved)
    var zoneProgress = zones.map(function (z) {
      var zr = recs.filter(function (r) { return r.zoneId === z.id; });
      var done = zr.filter(function (r) { return r.status === 'approved'; }).length;
      return { zone: z, total: zr.length, done: done };
    }).filter(function (x) { return x.total > 0; }).sort(function (a, b) { return b.total - a.total; });

    var zoneRows = zoneProgress.map(function (p) {
      var pct = p.total ? Math.round(p.done / p.total * 100) : 0;
      return '<tr class="border-b"><td class="px-3 py-2 text-sm font-medium text-slate-700">' + ui.esc(p.zone.name) + '</td>' +
        '<td class="px-3 py-2 text-sm text-slate-500">' + p.total + '</td>' +
        '<td class="px-3 py-2 text-sm text-emerald-600">' + p.done + '</td>' +
        '<td class="px-3 py-2 w-40"><div class="h-2 bg-slate-100 rounded-full overflow-hidden"><div class="h-full bg-emerald-500 rounded-full" style="width:' + pct + '%"></div></div></td>' +
        '<td class="px-3 py-2 text-xs text-slate-400">' + pct + '%</td></tr>';
    }).join('');

    var colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500', 'bg-blue-500', 'bg-pink-500', 'bg-teal-500'];
    function colorFn(i) { return colors[i % colors.length]; }

    $c.html(
      '<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">' +
        bigStat('Total Beneficiaries', recs.length, 'text-indigo-600', byForm.A + ' certified · ' + byForm.B + ' suspected') +
        bigStat('Approved', byStatus.approved, 'text-emerald-600', 'Verified by SWO') +
        bigStat('Pending Verification', byStatus.submitted, 'text-amber-600', 'Awaiting SWO') +
        bigStat('Active Zones', zoneProgress.length + ' / ' + zones.length, 'text-slate-700', 'with data entered') +
      '</div>' +

      '<div class="grid md:grid-cols-2 gap-5 mb-5">' +
        '<div class="bg-white border rounded-xl shadow-sm p-5"><h3 class="font-semibold text-slate-700 text-sm mb-3">Verification Status</h3>' +
          barList({ 'Draft': byStatus.draft, 'Submitted': byStatus.submitted, 'Approved': byStatus.approved, 'Returned': byStatus.returned }, colorFn) + '</div>' +
        '<div class="bg-white border rounded-xl shadow-sm p-5"><h3 class="font-semibold text-slate-700 text-sm mb-3">Form A vs Form B</h3>' +
          barList({ 'Form A (Certified)': byForm.A, 'Form B (Suspected)': byForm.B }, colorFn) + '</div>' +
        '<div class="bg-white border rounded-xl shadow-sm p-5"><h3 class="font-semibold text-slate-700 text-sm mb-3">Top Disability Types</h3>' +
          barList(byDisability, colorFn) + '</div>' +
        '<div class="bg-white border rounded-xl shadow-sm p-5"><h3 class="font-semibold text-slate-700 text-sm mb-3">Gender Distribution</h3>' +
          barList(byGender, colorFn) + '</div>' +
      '</div>' +

      '<div class="bg-white border rounded-xl shadow-sm">' +
        '<div class="px-4 py-3 border-b flex items-center justify-between"><h3 class="font-semibold text-slate-700 text-sm">Zone-wise Data Entry Progress</h3>' +
          '<a href="#/reports" class="text-xs text-indigo-600 hover:underline">Open full reports →</a></div>' +
        '<div class="overflow-x-auto max-h-96 overflow-y-auto"><table class="w-full"><thead class="sticky top-0 bg-white"><tr class="text-left text-xs uppercase text-slate-400 border-b">' +
          '<th class="px-3 py-2">Zone</th><th class="px-3 py-2">Records</th><th class="px-3 py-2">Approved</th><th class="px-3 py-2">Progress</th><th class="px-3 py-2"></th>' +
        '</tr></thead><tbody>' + (zoneRows || '<tr><td colspan="5">' + ui.emptyState('No data entered yet') + '</td></tr>') + '</tbody></table></div>' +
      '</div>'
    );
  }
});
