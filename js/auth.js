/* SDMIS — mock authentication, session, role guard */
window.SDMIS = window.SDMIS || {};

SDMIS.auth = (function () {
  var store = SDMIS.store;

  function login(username) {
    var user = store.where('officials', function (o) {
      return o.username.toLowerCase() === String(username).toLowerCase();
    })[0];
    if (!user) return null;
    store.setSession(user.id);
    return user;
  }

  function logout() {
    store.setSession(null);
  }

  function current() {
    var id = store.getSession();
    if (!id) return null;
    return store.find('officials', id);
  }

  function isLoggedIn() { return !!current(); }

  // default landing route per role
  function landing(role) {
    return {
      admin: '#/admin',
      inspector: '#/inspector',
      swo: '#/swo',
      hq: '#/hq'
    }[role] || '#/login';
  }

  // zone object for the current user (inspectors/swos)
  function currentZone() {
    var u = current();
    if (!u || !u.zoneId) return null;
    return store.find('zones', u.zoneId);
  }

  return {
    login: login,
    logout: logout,
    current: current,
    isLoggedIn: isLoggedIn,
    landing: landing,
    currentZone: currentZone
  };
})();
