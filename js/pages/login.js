/* SDMIS — Login page (mock auth with seeded accounts) */
window.SDMIS = window.SDMIS || {};

SDMIS.router.register('login', {
  roles: [],
  title: 'Login',
  render: function ($app) {
    var store = SDMIS.store;
    var ui = SDMIS.ui;

    // quick-pick demo accounts
    var firstZone = store.all('zones')[0];
    var demo = [
      { user: 'admin', role: 'Administrator', desc: 'Configure zones & officials' },
      { user: 'insp_' + (firstZone ? firstZone.code.toLowerCase() : 'z01') + '_a', role: 'Inspector', desc: (firstZone ? firstZone.name : '') + ' zone data entry' },
      { user: 'swo_' + (firstZone ? firstZone.code.toLowerCase() : 'z01'), role: 'SWO', desc: 'Verify ' + (firstZone ? firstZone.name : '') + ' records' },
      { user: 'hq', role: 'HQ Official', desc: 'Dashboard & reports' }
    ];

    var demoCards = demo.map(function (d) {
      return '<button type="button" class="demo-acc text-left w-full border border-slate-200 rounded-lg px-3 py-2 hover:border-indigo-400 hover:bg-indigo-50 transition" data-user="' + d.user + '">' +
        '<div class="flex items-center justify-between">' +
          '<span class="text-sm font-semibold text-slate-700">' + d.role + '</span>' +
          '<span class="text-[10px] font-mono text-indigo-500">' + d.user + '</span>' +
        '</div>' +
        '<div class="text-xs text-slate-400">' + d.desc + '</div>' +
      '</button>';
    }).join('');

    var html =
      '<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 p-4">' +
        '<div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl grid md:grid-cols-2 overflow-hidden">' +
          // left brand panel
          '<div class="bg-slate-800 text-white p-8 flex flex-col justify-center">' +
            '<div class="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center font-bold mb-4">SD</div>' +
            '<h1 class="text-2xl font-bold mb-1">SDMIS</h1>' +
            '<p class="text-indigo-200 text-sm mb-4">State Disability Management Information System</p>' +
            '<p class="text-slate-300 text-xs leading-relaxed">Women, Child, Senior Citizen &amp; Divyangjan Welfare Department. ' +
            'Zone-wise data entry of Form A (Certified) and Form B (Suspected) disability cases, verification and monitoring.</p>' +
            '<div class="mt-6 grid grid-cols-3 gap-2 text-center">' +
              '<div class="bg-slate-700/50 rounded-lg py-2"><div class="text-lg font-bold">58</div><div class="text-[10px] text-slate-400">Zones</div></div>' +
              '<div class="bg-slate-700/50 rounded-lg py-2"><div class="text-lg font-bold">116</div><div class="text-[10px] text-slate-400">Inspectors</div></div>' +
              '<div class="bg-slate-700/50 rounded-lg py-2"><div class="text-lg font-bold">2</div><div class="text-[10px] text-slate-400">Forms</div></div>' +
            '</div>' +
          '</div>' +
          // right login form
          '<div class="p-8">' +
            '<h2 class="text-lg font-semibold text-slate-800 mb-1">Sign in</h2>' +
            '<p class="text-xs text-slate-400 mb-4">Enter your username (password not required in this prototype).</p>' +
            '<form id="login-form">' +
              '<label class="block text-sm font-medium text-slate-600 mb-1">Username</label>' +
              '<input id="login-user" type="text" placeholder="e.g. admin" class="' + ui.inputCls + ' mb-3" autocomplete="off">' +
              '<label class="block text-sm font-medium text-slate-600 mb-1">Password</label>' +
              '<input id="login-pass" type="password" placeholder="any value" class="' + ui.inputCls + ' mb-4">' +
              '<button type="submit" class="w-full bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700">Sign in</button>' +
              '<p id="login-error" class="text-xs text-rose-500 mt-2 hidden">Username not found. Try a demo account below.</p>' +
            '</form>' +
            '<div class="mt-5">' +
              '<p class="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Quick demo accounts</p>' +
              '<div class="space-y-2">' + demoCards + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    $app.html(html);

    function attempt(username) {
      var user = SDMIS.auth.login(username);
      if (!user) { $('#login-error').removeClass('hidden'); return; }
      SDMIS.router.go(SDMIS.auth.landing(user.role));
    }

    $('#login-form').on('submit', function (e) {
      e.preventDefault();
      attempt($('#login-user').val().trim());
    });
    $('.demo-acc').on('click', function () {
      attempt($(this).data('user'));
    });
  }
});
