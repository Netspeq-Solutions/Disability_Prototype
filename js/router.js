/* SDMIS — hash router, app shell + role-gated navigation */
window.SDMIS = window.SDMIS || {};

SDMIS.router = (function () {
  var auth = SDMIS.auth;
  var routes = {}; // name -> { roles:[], render:fn, title }

  function register(name, def) { routes[name] = def; }

  // nav menus per role
  var NAV = {
    admin: [
      { route: 'admin', icon: '🗓️', label: 'Surveys' },
      { route: 'admin/zones', icon: '🗺️', label: 'Zones' },
      { route: 'admin/officials', icon: '👥', label: 'Officials' },
      { route: 'admin/masters', icon: '🗂️', label: 'Masters' }
    ],
    inspector: [
      { route: 'inspector', icon: '📝', label: 'My Records' }
    ],
    swo: [
      { route: 'swo', icon: '✔️', label: 'Verification' }
    ],
    hq: [
      { route: 'hq', icon: '📊', label: 'Dashboard' },
      { route: 'reports', icon: '📑', label: 'Reports' },
      { route: 'reports/caregiver', icon: '👪', label: 'Caregiver Coverage' },
      { route: 'reports/salaried', icon: '💰', label: 'Salaried Caregivers' },
      { route: 'reports/pension', icon: '🏦', label: 'Pension Enrolment' },
      { route: 'reports/services', icon: '🩺', label: 'Services Utilisation' }
    ]
  };

  function parseHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(function (p) { return p.length; });
    return {
      name: parts[0] || '',
      params: parts.slice(1)
    };
  }

  function go(hash) { location.hash = hash; }

  function shell(user, parsed, contentRenderer) {
    var C = SDMIS.constants;
    var zone = auth.currentZone();
    var activeRoute = parsed.name;
    // full path incl. first param, e.g. 'admin/masters' — lets nested nav items highlight correctly
    var activePath = parsed.name + (parsed.params && parsed.params.length ? '/' + parsed.params[0] : '');
    var navList = NAV[user.role] || [];
    var navRoutes = navList.map(function (n) { return n.route; });
    function isActive(n) {
      if (n.route.indexOf('/') > -1) return n.route === activePath;      // nested item: exact path match
      if (parsed.name !== n.route) return false;                          // single-segment item
      // defer to a more specific sibling when the current path matches one (e.g. admin vs admin/masters)
      return navRoutes.indexOf(activePath) === -1 || activePath === n.route;
    }
    var navItems = navList.map(function (n) {
      var active = isActive(n);
      return '<a href="#/' + n.route + '" class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ' +
        (active ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:bg-slate-700/60') + '">' +
        '<span>' + n.icon + '</span>' + n.label + '</a>';
    }).join('');

    var subtitle = zone ? (zone.name + ' Zone · ' + zone.code) : C.roles[user.role];

    var html =
      '<div class="flex h-screen overflow-hidden">' +
        // mobile backdrop (tap to close the drawer)
        '<div id="nav-backdrop" class="fixed inset-0 bg-black/40 z-30 hidden md:hidden"></div>' +
        // sidebar — off-canvas drawer on mobile, persistent on md+
        '<aside id="sidebar" class="fixed md:static inset-y-0 left-0 z-40 w-64 max-w-[80%] bg-slate-800 text-white flex flex-col shrink-0 ' +
          '-translate-x-full md:translate-x-0 transition-transform duration-200 ease-out">' +
          '<div class="px-5 py-4 border-b border-slate-700 flex items-center justify-between">' +
            '<div class="flex items-center gap-2">' +
              '<div class="w-9 h-9 rounded-lg bg-indigo-500 flex items-center justify-center font-bold text-sm">SD</div>' +
              '<div><div class="font-bold leading-tight">SDMIS</div>' +
              '<div class="text-[10px] text-slate-400 leading-tight">Disability MIS</div></div>' +
            '</div>' +
            '<button id="nav-close" class="md:hidden text-slate-400 hover:text-white text-2xl leading-none">&times;</button>' +
          '</div>' +
          '<nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">' + navItems + '</nav>' +
          // mobile-only logout inside drawer
          '<button id="btn-logout-m" class="md:hidden mx-3 mb-2 text-sm text-rose-300 hover:text-rose-200 border border-slate-700 rounded-lg px-3 py-2 text-left">Logout</button>' +
          '<div class="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">' +
            'Women, Child, Senior Citizen &amp; Divyangjan Welfare Dept.' +
          '</div>' +
        '</aside>' +
        // main
        '<div class="flex-1 flex flex-col overflow-hidden w-full">' +
          '<header class="bg-white border-b px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 gap-2">' +
            '<div class="flex items-center gap-2 min-w-0">' +
              '<button id="nav-toggle" class="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-md" aria-label="Menu">' +
                '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>' +
              '</button>' +
              '<div class="min-w-0"><h1 id="page-title" class="text-base sm:text-lg font-semibold text-slate-800 truncate">' + (routes[activeRoute] ? routes[activeRoute].title : '') + '</h1>' +
              '<p class="text-xs text-slate-400 truncate">' + SDMIS.ui.esc(subtitle) + '</p></div>' +
            '</div>' +
            '<div class="flex items-center gap-2 sm:gap-3 shrink-0">' +
              '<div class="text-right hidden sm:block">' +
                '<div class="text-sm font-medium text-slate-700">' + SDMIS.ui.esc(user.name) + '</div>' +
                '<div class="text-xs text-slate-400">' + SDMIS.ui.esc(C.roles[user.role]) + '</div>' +
              '</div>' +
              '<div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0">' +
                SDMIS.ui.esc(user.name.charAt(0)) + '</div>' +
              '<button id="btn-logout" class="hidden md:inline-block text-sm text-slate-500 hover:text-rose-600 border border-slate-200 rounded-md px-3 py-1.5">Logout</button>' +
            '</div>' +
          '</header>' +
          '<main id="page-content" class="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6"></main>' +
        '</div>' +
      '</div>';

    $('#app').html(html);

    function openNav() { $('#sidebar').removeClass('-translate-x-full'); $('#nav-backdrop').removeClass('hidden'); }
    function closeNav() { $('#sidebar').addClass('-translate-x-full'); $('#nav-backdrop').addClass('hidden'); }
    $('#nav-toggle').on('click', openNav);
    $('#nav-close, #nav-backdrop').on('click', closeNav);
    // tapping a nav link closes the drawer on mobile
    $('#sidebar nav a').on('click', closeNav);

    function doLogout() { auth.logout(); go('#/login'); }
    $('#btn-logout, #btn-logout-m').on('click', doLogout);

    contentRenderer($('#page-content'));
  }

  function render() {
    var parsed = parseHash();
    var user = auth.current();

    // login route (no shell)
    if (parsed.name === 'login' || parsed.name === '') {
      if (user) { go(auth.landing(user.role)); return; }
      routes.login.render($('#app'));
      return;
    }

    // must be authenticated
    if (!user) { go('#/login'); return; }

    var route = routes[parsed.name];
    if (!route) { go(auth.landing(user.role)); return; }

    // role gate
    if (route.roles.indexOf(user.role) === -1) {
      SDMIS.ui.toast('Access denied for your role', 'error');
      go(auth.landing(user.role));
      return;
    }

    shell(user, parsed, function ($content) {
      route.render($content, parsed.params);
    });
  }

  function start() {
    $(window).on('hashchange', render);
    render();
  }

  return { register: register, go: go, start: start, parseHash: parseHash };
})();
