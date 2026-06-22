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
    masters: {},     // admin-configurable dropdown lists (disability types, schemes, services, caregiver types)
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

  // ---- masters (admin-configurable dropdown lists) ----
  // Each master is a list of { id, name } records. Dropdowns use the NAME as the
  // stored value (keeps records/reports human-readable); the ID is a stable key
  // used by the Admin editor. Legacy string-array masters are normalised on read.
  function slugId(key, name, i) {
    var base = String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return base || (key + '-' + i);
  }
  // Full { id, name } records — used by the Admin configuration screens.
  function masterItems(key) {
    var raw = (read().masters || {})[key];
    if (!Array.isArray(raw)) {
      var C = SDMIS.constants || {};
      raw = Array.isArray(C[key]) ? C[key] : [];
    }
    return raw.map(function (it, i) {
      if (it && typeof it === 'object') return { id: it.id || slugId(key, it.name, i), name: it.name };
      return { id: slugId(key, it, i), name: it };
    });
  }
  // Just the names — used to populate form dropdowns / comparisons.
  function master(key) {
    return masterItems(key).map(function (it) { return it.name; });
  }
  // Options for ui.select / ui.multiSelect (value = name, label = name).
  function masterOptions(key) {
    return masterItems(key).map(function (it) { return { value: it.name, label: it.name }; });
  }
  function setMasterItems(key, items) {
    var db = read();
    if (!db.masters) db.masters = {};
    db.masters[key] = items;
    write(db);
  }

  // ---- bulk seed (used once by seed.js) ----
  function seedDb(data) {
    var db = read();
    db.surveys = data.surveys || [];
    db.zones = data.zones;
    db.officials = data.officials;
    db.beneficiaries = data.beneficiaries;
    db.masters = data.masters || {};
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
    master: master,
    masterItems: masterItems,
    masterOptions: masterOptions,
    setMasterItems: setMasterItems,
    audit: audit,
    seedDb: seedDb,
    isSeeded: isSeeded,
    resetAll: resetAll
  };
})();
