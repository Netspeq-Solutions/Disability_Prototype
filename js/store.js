/* SDMIS — localStorage data layer */
window.SDMIS = window.SDMIS || {};

SDMIS.store = (function () {
  var ROOT = 'sdmis.v1';

  var DEFAULT_DB = {
    seeded: false,
    surveys: [],
    zones: [],
    officials: [],
    beneficiaries: [],
    auditLog: [],
    prefs: {},       // misc UI prefs (e.g. selected survey per inspector)
    session: null    // current user id
  };

  function read() {
    try {
      var raw = localStorage.getItem(ROOT);
      if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DB));
      var db = JSON.parse(raw);
      // backfill any missing collections
      Object.keys(DEFAULT_DB).forEach(function (k) {
        if (typeof db[k] === 'undefined') db[k] = JSON.parse(JSON.stringify(DEFAULT_DB[k]));
      });
      return db;
    } catch (e) {
      console.error('store.read failed', e);
      return JSON.parse(JSON.stringify(DEFAULT_DB));
    }
  }

  function write(db) {
    localStorage.setItem(ROOT, JSON.stringify(db));
    return db;
  }

  function uid(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' +
      Math.random().toString(36).slice(2, 7);
  }

  // ---- generic collection helpers ----
  function all(collection) {
    return read()[collection] || [];
  }

  function find(collection, id) {
    return all(collection).filter(function (x) { return x.id === id; })[0] || null;
  }

  function where(collection, predicate) {
    return all(collection).filter(predicate);
  }

  function insert(collection, obj) {
    var db = read();
    if (!obj.id) obj.id = uid(collection.slice(0, 3));
    db[collection].push(obj);
    write(db);
    return obj;
  }

  function update(collection, id, patch) {
    var db = read();
    var idx = db[collection].findIndex(function (x) { return x.id === id; });
    if (idx === -1) return null;
    db[collection][idx] = Object.assign({}, db[collection][idx], patch);
    write(db);
    return db[collection][idx];
  }

  function replace(collection, id, obj) {
    var db = read();
    var idx = db[collection].findIndex(function (x) { return x.id === id; });
    if (idx === -1) return null;
    obj.id = id;
    db[collection][idx] = obj;
    write(db);
    return obj;
  }

  function remove(collection, id) {
    var db = read();
    db[collection] = db[collection].filter(function (x) { return x.id !== id; });
    write(db);
  }

  // ---- session ----
  function setSession(userId) {
    var db = read();
    db.session = userId;
    write(db);
  }
  function getSession() {
    return read().session;
  }

  // ---- audit ----
  function audit(action, recordId, note) {
    insert('auditLog', {
      ts: new Date().toISOString(),
      userId: getSession(),
      action: action,
      recordId: recordId || null,
      note: note || ''
    });
  }

  // ---- prefs ----
  function getPref(key, fallback) {
    var p = read().prefs || {};
    return typeof p[key] === 'undefined' ? fallback : p[key];
  }
  function setPref(key, val) {
    var db = read();
    if (!db.prefs) db.prefs = {};
    db.prefs[key] = val;
    write(db);
  }

  // ---- bulk seed (used once by seed.js) ----
  function seedDb(data) {
    var db = read();
    db.surveys = data.surveys || [];
    db.zones = data.zones;
    db.officials = data.officials;
    db.beneficiaries = data.beneficiaries;
    db.seeded = true;
    write(db);
  }

  function isSeeded() {
    return read().seeded === true;
  }

  function resetAll() {
    localStorage.removeItem(ROOT);
  }

  return {
    ROOT: ROOT,
    read: read,
    write: write,
    uid: uid,
    all: all,
    find: find,
    where: where,
    insert: insert,
    update: update,
    replace: replace,
    remove: remove,
    setSession: setSession,
    getSession: getSession,
    getPref: getPref,
    setPref: setPref,
    audit: audit,
    seedDb: seedDb,
    isSeeded: isSeeded,
    resetAll: resetAll
  };
})();
