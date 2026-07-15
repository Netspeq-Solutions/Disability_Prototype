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

  // Blocks an inspector is mapped to (array of block names)
  function currentBlocks() {
    var u = current();
    return (u && Array.isArray(u.blocks)) ? u.blocks : [];
  }

  // District a SWO is mapped to (name), or ''
  function currentDistrict() {
    var u = current();
    return (u && u.district) ? u.district : '';
  }

  return {
    login: login,
    logout: logout,
    current: current,
    isLoggedIn: isLoggedIn,
    landing: landing,
    currentBlocks: currentBlocks,
    currentDistrict: currentDistrict
  };
})();
