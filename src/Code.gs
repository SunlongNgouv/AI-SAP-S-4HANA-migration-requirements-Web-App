/**
 * Requirement Hub - server code
 * Google Apps Script, container-bound to the Google Sheet "Business Requirements" file.
 * Run setup() once from the Apps Script editor, then deploy as a web app.
 */
const CFG = {
  APP_NAME: 'Requirement Hub',
  REQ_SHEET: 'Business Requirements',
  ACCESS_SHEET: 'Access',
  LOG_SHEET: 'Audit Log',
  GUIDE_SHEET: 'Process Guide',
  OWNERS: ['your.name@example.com'],   // REPLACE with your own email. First Owner(s); more are added from the Access tab
  POLL_MS: 7000
};

const LISTS = {
  // Sample values only. In your sheet, set these columns up as dropdown lists (Data > Data validation)
  // and the app follows the sheet. These values are used only when a dropdown cannot be read.
  areas: ['Master Data','Pricing','Sales','Order Fulfillment','Returns','Planning','Manufacturing','Logistics','Procurement','Trade Compliance','Reporting','Finance'],
  procs: ['Demand planning','Supply planning','Order promising','Order fulfillment','Shipping and receiving','Returns handling','Reporting','Configuration','Other'],
  orders: ['Standard sale','Proof of concept','Internal order','Replacement order','Renewal','Special program','Other'],
  brd: ['Pain Point','System Efficiency','Operations Enhancement'],
  status: ['Pending','Reviewed','Duplicated','Obsoleted'],
  demo: ['Yes','No','Maybe'],
  priority: ['High', 'Medium', 'Low']
};

// [key, sheet header]. Headers are matched by name (not by column letter), so inserting or moving columns is safe.
// Write 'A|B' to accept either header. A header also matches if it merely STARTS with the name below (e.g. "Follow-up Question (BA -> Stakeholders)").
const F = [['req','REQ #'],['area','L2- PROCESS AREA'],['proc','PROCESS'],['name','REQUIREMENT NAME'],['order','ORDER TYPE'],['brd','BRD TYPE'],['desc','DESCRIPTION|SIGNIFICANCE / DESCRIPTION'],['asis','AS IS PROCESS'],['future','CHANGE REQUEST'],['behavior','ORDER BEHAVIOR'],['datalevel','DATA LEVEL'],['demo','DEMO READY'],['source','BRD SOURCE'],['usecase','DATA SOURCE/USE CASE(S)'],['status','STATUS'],['lucid','Lucid Chart'],['priority','PRIORITY'],['follow','Follow-up Question'],['answers','ANSWERS'],['notes','NOTES/COMMENTS']];
// New columns the app adds to the right of your existing columns
const SYSF = [['respName','RESPONDER NAME'],['respEmail','RESPONDER EMAIL'],['logged','LOGGED ON'],['updated','LAST UPDATED'],['deleted','DELETED']];
const HDR_ = {}, SPEC_ = {};   // HDR_ = display name, SPEC_ = header spec (alternatives separated by |)
F.concat(SYSF).forEach(function (x) { SPEC_[x[0]] = x[1]; HDR_[x[0]] = x[1].split('|')[0]; });
const EDITABLE_ = F.slice(1).map(function (x) { return x[0]; });
const LISTKEY_ = { area: 'areas', proc: 'procs', order: 'orders', brd: 'brd', status: 'status', demo: 'demo', priority: 'priority' };
const LABELS_ = { area: 'Process area', proc: 'Process', name: 'Requirement name', order: 'Order type', brd: 'Type', desc: 'The issue', asis: 'Current practice', future: 'Change request', behavior: 'Order behavior', datalevel: 'Data level', demo: 'Demo ready', source: 'BRD source', usecase: 'Supporting documents', status: 'Status', lucid: 'Lucid chart', priority: 'Priority', follow: 'Follow-up question', answers: 'Answers', notes: 'Notes' };
function lbl_(k) { return LABELS_[k] || HDR_[k] || k; }
const RANK_ = { viewer: 1, editor: 2, owner: 3 };
const ACC_H = ['EMAIL','NAME','ROLE','STATUS','REQUESTED ROLE','REASON','REQUESTED AT','DECIDED BY','DECIDED AT'];
const LOG_H = ['TIMESTAMP','USER','ACTION','REQ #','FIELD','OLD VALUE','NEW VALUE','SOURCE'];

/* ------------------------------ web app entry ------------------------------ */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CFG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/* ------------------------------ one-time setup ----------------------------- */
function setup() {
  const sh = reqSheet_();
  ensureCols_(sh);
  accSheet_(); logSheet_(); ensureGuide_();
  CFG.OWNERS.forEach(function (e) { seedOwner_(e); });
  protect_(ss_().getSheetByName(CFG.ACCESS_SHEET));
  protect_(ss_().getSheetByName(CFG.LOG_SHEET));
  installTriggers();
  if (!getVer_()) PropertiesService.getScriptProperties().setProperty('VER', '1');
  CacheService.getScriptCache().remove('ACC');
  CacheService.getScriptCache().remove('LISTS');
  CacheService.getScriptCache().remove('GUIDE');
  Logger.log('Setup complete. Now: Deploy > New deployment > Web app.');
}
function installTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onSheetEdit') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss_()).onEdit().create();
}
function protect_(sh) {
  if (!sh) return;
  sh.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { p.remove(); });
  const p = sh.protect().setDescription('Managed by ' + CFG.APP_NAME);
  p.removeEditors(p.getEditors());
  const me = Session.getEffectiveUser();
  if (p.canDomainEdit()) p.setDomainEdit(false);
  p.addEditor(me);
}

/* ------------------------------ helpers ------------------------------------ */
function ensureGuide_() {
  if (ss_().getSheetByName(CFG.GUIDE_SHEET)) return;
  const sh = ss_().insertSheet(CFG.GUIDE_SHEET);
  sh.getRange(1, 1, 1, 4).setValues([['L1 – End-to-End Process', 'L2 – Process Area', 'L3 – Process', 'L4 – Activity / Task']]).setFontWeight('bold');
  sh.getRange(2, 1, GUIDE_SNAPSHOT.length, 4).setValues(GUIDE_SNAPSHOT);
  sh.setFrozenRows(1);
}
// Reads the "Process Guide" tab (columns whose headers start with L1, L2, L3, L4). Falls back to the built-in snapshot.
function guideRows_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('GUIDE');
  if (hit) return JSON.parse(hit);
  let rows = null;
  try {
    const sh = ss_().getSheetByName(CFG.GUIDE_SHEET);
    if (sh && sh.getLastRow() > 1) {
      const vals = sh.getRange(1, 1, sh.getLastRow(), Math.max(4, sh.getLastColumn())).getValues();
      const hdr = vals[0].map(norm_), idx = {};
      ['L1', 'L2', 'L3', 'L4'].forEach(function (p) { for (let i = 0; i < hdr.length; i++) { if (hdr[i].indexOf(p) === 0) { idx[p] = i; break; } } });
      if (idx.L2 != null && idx.L3 != null) {
        const cell = function (r, i) { return i == null ? '' : String(r[i] == null ? '' : r[i]).trim(); };
        rows = vals.slice(1).map(function (r) { return [cell(r, idx.L1), cell(r, idx.L2), cell(r, idx.L3), cell(r, idx.L4)]; })
          .filter(function (r) { return r[1] && r[2]; });
      }
    }
  } catch (e) { console.warn('Process Guide tab not readable, using the built-in guide. ' + e); }
  if (!rows || !rows.length) rows = GUIDE_SNAPSHOT;
  cache.put('GUIDE', JSON.stringify(rows), 300);
  return rows;
}
function guideData_() {
  const rows = guideRows_(), areas = {}, order = [];
  rows.forEach(function (r) {
    const l1 = r[0] || r[1], a = r[1];
    if (!areas[a]) areas[a] = { l1: {}, items: [] };
    areas[a].l1[l1] = (areas[a].l1[l1] || 0) + 1;
    areas[a].items.push({ p: r[2], a: r[3] });
    if (order.indexOf(l1) < 0) order.push(l1);
  });
  Object.keys(areas).forEach(function (a) {
    const counts = areas[a].l1;
    areas[a].l1 = Object.keys(counts).sort(function (x, y) { return counts[y] - counts[x]; });
  });
  return { areas: areas, order: order };
}
function ss_() { return SpreadsheetApp.getActive(); }
function norm_(s) { return String(s == null ? '' : s).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
function reqSheet_() {
  const sh = ss_().getSheetByName(CFG.REQ_SHEET);
  if (!sh) throw new Error('The sheet tab "' + CFG.REQ_SHEET + '" could not be found. Please ask the app owner to check the tab name.');
  return sh;
}
function layout_(sh) {
  const lastCol = sh.getLastColumn(), top = Math.min(sh.getLastRow(), 40);
  const vals = sh.getRange(1, 1, top, lastCol).getValues();
  let hr = 0;
  for (let i = 0; i < vals.length; i++) { if (norm_(vals[i][0]) === 'REQ') { hr = i + 1; break; } }
  if (!hr) throw new Error('The header row (the one starting with "REQ #") could not be found in the sheet.');
  const map = {}; let lastHdr = 0;
  vals[hr - 1].forEach(function (h, i) {
    const n = norm_(h);
    if (n) { lastHdr = i + 1; if (!(n in map)) map[n] = i + 1; }
  });
  return { hr: hr, map: map, lastHdr: lastHdr };
}
function col_(L, h) {
  const alts = String(h).split('|');
  for (let a = 0; a < alts.length; a++) {
    const n = norm_(alts[a]);
    if (L.map[n]) return L.map[n];
    for (const k in L.map) { if (k.indexOf(n) === 0) return L.map[k]; }   // header that starts with the name
  }
  return undefined;
}
function missingCols_() {
  const L = layout_(reqSheet_());
  return F.concat(SYSF).filter(function (x) { return !col_(L, x[1]); }).map(function (x) { return HDR_[x[0]]; });
}
function ensureCols_(sh) {
  let L = layout_(sh), next = L.lastHdr + 1, added = false;
  SYSF.forEach(function (x) {
    if (!col_(L, x[1])) {
      sh.getRange(L.hr, next).setValue(x[1]).setFontWeight('bold').setBackground('#FFE2CF');
      L.map[norm_(x[1])] = next; next++; added = true;
    }
  });
  if (added) SpreadsheetApp.flush();
  L = layout_(sh);
  ['LOGGED ON','LAST UPDATED'].forEach(function (h) {
    const c = col_(L, h);
    if (c) sh.getRange(L.hr + 1, c, Math.max(1, sh.getMaxRows() - L.hr), 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  });
  return L;
}
function withLock_(fn) {
  const lock = LockService.getScriptLock(); try { lock.waitLock(25000); } catch (e) { throw new Error('Someone else is saving at the same moment. Please try again in a few seconds.'); }
  try { return fn(); } finally { lock.releaseLock(); }
}
function getVer_() { return Number(PropertiesService.getScriptProperties().getProperty('VER') || 0); }
function bump_() { PropertiesService.getScriptProperties().setProperty('VER', String(getVer_() + 1)); }
function safe_(s) { s = String(s); return s.charAt(0) === '=' ? "'" + s : s; }
function sameStamp_(a, b) {
  const x = Date.parse(a), y = Date.parse(b);
  if (isNaN(x) || isNaN(y)) return a === b;
  return Math.floor(x / 1000) === Math.floor(y / 1000);
}
function iso_(v) { return v ? new Date(v).toISOString() : ''; }

function readAll_() {
  const sh = reqSheet_(), L = layout_(sh), rows = [];
  const n = sh.getLastRow() - L.hr;
  if (n > 0) {
    const vals = sh.getRange(L.hr + 1, 1, n, sh.getLastColumn()).getValues();
    const idx = {}; F.concat(SYSF).forEach(function (x) { idx[x[0]] = col_(L, x[1]) || 0; });
    vals.forEach(function (v, i) {
      const req = idx.req ? String(v[idx.req - 1] || '').trim() : '';
      if (!req) return;
      const o = { row: L.hr + 1 + i };
      F.concat(SYSF).forEach(function (x) {
        const c = idx[x[0]]; let val = c ? v[c - 1] : '';
        if (val instanceof Date) val = val.toISOString();
        o[x[0]] = (val == null) ? '' : String(val);
      });
      o.req = req; o.deleted = String(o.deleted).toUpperCase() === 'Y';
      rows.push(o);
    });
  }
  return { sh: sh, L: L, rows: rows };
}
function setCells_(sh, L, row, obj) {
  const keys = Object.keys(obj), missing = [];
  keys.forEach(function (k) { if (!col_(L, SPEC_[k])) missing.push(HDR_[k]); });
  if (missing.length) {
    throw new Error('Some columns could not be found in the sheet (' + missing.join(', ') + '). Please ask the app owner to restore those column headers.');
  }
  keys.forEach(function (k) {
    const v = obj[k];
    sh.getRange(row, col_(L, SPEC_[k])).setValue(typeof v === 'string' ? safe_(v) : v);
  });
}

function clearRow_(sh, L, row, keys) {
  keys.forEach(function (k) { const c = col_(L, SPEC_[k]); if (c) { try { sh.getRange(row, c).clearContent(); } catch (e) {} } });
}
function restoreRow_(sh, L, cur, keys) {
  keys.forEach(function (k) {
    const c = col_(L, SPEC_[k]); if (!c) return;
    try { const v = cur[k]; if (v === '' || v == null) sh.getRange(cur.row, c).clearContent(); else sh.getRange(cur.row, c).setValue(k === 'updated' ? new Date(v) : safe_(v)); } catch (e) {}
  });
}

/* ------------------------------ access control ----------------------------- */
function accSheet_() {
  let sh = ss_().getSheetByName(CFG.ACCESS_SHEET);
  if (!sh) { sh = ss_().insertSheet(CFG.ACCESS_SHEET); sh.getRange(1, 1, 1, ACC_H.length).setValues([ACC_H]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function logSheet_() {
  let sh = ss_().getSheetByName(CFG.LOG_SHEET);
  if (!sh) { sh = ss_().insertSheet(CFG.LOG_SHEET); sh.getRange(1, 1, 1, LOG_H.length).setValues([LOG_H]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function accRows_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('ACC');
  if (hit) return JSON.parse(hit);
  const sh = accSheet_(), n = sh.getLastRow() - 1, rows = [];
  if (n > 0) {
    sh.getRange(2, 1, n, ACC_H.length).getValues().forEach(function (r, i) {
      if (!r[0]) return;
      rows.push({ row: i + 2, email: String(r[0]).toLowerCase(), name: String(r[1] || ''), role: String(r[2] || '').toLowerCase(),
        status: String(r[3] || ''), reqRole: String(r[4] || '').toLowerCase(), reason: String(r[5] || ''),
        reqAt: iso_(r[6]), by: String(r[7] || ''), at: iso_(r[8]) });
    });
  }
  cache.put('ACC', JSON.stringify(rows), 120);
  return rows;
}
function cap_(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function putAcc_(o) {
  const sh = accSheet_(), rows = accRows_(), cur = rows.filter(function (r) { return r.email === o.email; })[0];
  const vals = [o.email, o.name || '', cap_(o.role), o.status, cap_(o.reqRole), o.reason || '', o.reqAt ? new Date(o.reqAt) : '', o.by || '', o.at ? new Date(o.at) : ''];
  if (cur) sh.getRange(cur.row, 1, 1, ACC_H.length).setValues([vals]); else sh.appendRow(vals);
  CacheService.getScriptCache().remove('ACC');
}
function seedOwner_(email) {
  email = email.toLowerCase();
  const cur = accRows_().filter(function (r) { return r.email === email; })[0];
  if (!cur || cur.role !== 'owner' || cur.status !== 'Active') {
    putAcc_({ email: email, name: cur ? cur.name : '', role: 'owner', status: 'Active', reqRole: 'owner', by: 'setup', at: new Date().toISOString() });
  }
}
function me_() {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email) return { email: '', name: '', role: null, status: 'none' };
  if (CFG.OWNERS.map(function (s) { return s.toLowerCase(); }).indexOf(email) > -1) seedOwner_(email);
  const r = accRows_().filter(function (x) { return x.email === email; })[0];
  if (!r) return { email: email, name: '', role: null, status: 'none' };
  return { email: email, name: r.name, role: r.status === 'Active' ? r.role : null, status: r.status };
}
function need_(min) {
  const m = me_();
  if (!m.role || RANK_[m.role] < RANK_[min]) throw new Error('You do not have permission to do this. It needs the ' + cap_(min) + ' role or higher.');
  return m;
}
function log_(user, action, req, field, oldV, newV, source) {
  logSheet_().appendRow([new Date(), user, action, req || '', field || '', safe_(String(oldV == null ? '' : oldV).slice(0, 2000)), safe_(String(newV == null ? '' : newV).slice(0, 2000)), source || 'Web app']);
}
function mail_(to, subject, html) {
  try { MailApp.sendEmail({ to: to, subject: '[' + CFG.APP_NAME + '] ' + subject, htmlBody: html, name: CFG.APP_NAME }); }
  catch (e) { console.warn('Mail failed: ' + e); }
}
function appUrl_() { try { return ScriptApp.getService().getUrl(); } catch (e) { return ''; } }

/* ------------------------------ API: session ------------------------------- */
function bootstrap() {
  const sh = reqSheet_(), m = me_();
  return {
    me: m,
    cfg: { lists: lists_(), pollMs: CFG.POLL_MS },
    sheetUrl: ss_().getUrl() + '#gid=' + sh.getSheetId(),
    ver: getVer_(),
    guide: (function () { try { return m.role ? guideData_() : null; } catch (e) { return null; } })(),
    missing: m.role === 'owner' ? missingCols_() : []
  };
}
function poll() { need_('viewer'); return getVer_(); }
function getData() {
  const m = need_('viewer');
  const rows = readAll_().rows.filter(function (r) { return !r.deleted || m.role === 'owner'; });
  return { rows: rows, ver: getVer_(), now: new Date().toISOString() };
}

/* ------------------------------ API: requirements -------------------------- */
function friendly_(msg) {
  const t = unesc_(msg).replace(/^(Exception|Error):\s?/i, '');
  const m = /cell ([A-Z]+[0-9]+) violates the data validation rules.*following values:\s?(.*)$/i.exec(t);
  if (m) return 'The sheet only accepts certain choices in cell ' + m[1] + '. Allowed values: ' + m[2].replace(/\.$/, '') + '.';
  return t;
}
function unesc_(x) { return String(x).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"); }
// The dropdown rules on the sheet are the source of truth. Falls back to the built-in LISTS for any column without a list rule.
function lists_() {
  const cache = CacheService.getScriptCache(), hit = cache.get('LISTS');
  if (hit) return JSON.parse(hit);
  const out = JSON.parse(JSON.stringify(LISTS));
  try {
    const sh = reqSheet_(), L = layout_(sh), row = L.hr + 1, crit = SpreadsheetApp.DataValidationCriteria;
    [['area', 'areas'], ['proc', 'procs'], ['order', 'orders'], ['brd', 'brd'], ['status', 'status'], ['demo', 'demo'], ['priority', 'priority']].forEach(function (p) {
      const c = col_(L, SPEC_[p[0]]); if (!c) return;
      try {
        const dv = sh.getRange(row, c).getDataValidation(); if (!dv) return;
        const t = dv.getCriteriaType(); let vals = null;
        if (t === crit.VALUE_IN_LIST) vals = dv.getCriteriaValues()[0];
        else if (t === crit.VALUE_IN_RANGE) vals = [].concat.apply([], dv.getCriteriaValues()[0].getValues());
        vals = (vals || []).map(function (v) { return String(v).trim(); }).filter(function (v) { return v; });
        if (vals.length) out[p[1]] = vals;
      } catch (e) { console.warn('Dropdown read failed for ' + p[0] + ': ' + e); }
    });
  } catch (e) { console.warn('Dropdown lists: using built-in lists. ' + e); }
  cache.put('LISTS', JSON.stringify(out), 300);
  return out;
}
function canon_(list, part) {
  const lc = String(part).toLowerCase();
  for (let i = 0; i < list.length; i++) { if (String(list[i]).toLowerCase() === lc) return list[i]; }
  return null;
}
function splitList_(v) { return String(v || '').split(/\s*,\s*/).filter(Boolean); }
function clean_(rec, cur) {
  const out = {}, LS = lists_();
  EDITABLE_.forEach(function (k) {
    if (!(k in rec)) return;
    let v = String(rec[k] == null ? '' : rec[k]).trim().slice(0, 8000);
    if (LISTKEY_[k]) {
      const list = LS[LISTKEY_[k]], changed = !cur || String(cur[k]) !== v;
      if (changed && v && list && list.length) {
        const parts = splitList_(v), multi = (k === 'area' || k === 'order');
        if (!multi && parts.length !== 1) throw new Error(lbl_(k) + ': please choose only one value.');
        v = parts.map(function (p) {
          const c = canon_(list, p);
          if (!c) throw new Error('"' + p + '" is not one of the choices allowed for ' + lbl_(k) + '. Please choose one of: ' + list.join(', ') + '.');
          return c;
        }).join(', ');
      }
    }
    if (!cur && (k === 'usecase' || k === 'lucid') && v && !/https?:\/\/\S+/i.test(v)) {
      throw new Error(lbl_(k) + ': please paste a link that starts with http:// or https://');
    }
    out[k] = v;
  });
  return out;
}
function saveRequirement(rec) {
  const m = need_('editor');
  return withLock_(function () {
    const sh = reqSheet_(), L = ensureCols_(sh), all = readAll_(), now = new Date();
    if (!rec.req) {
      const clean = clean_(rec, null);
      ['name','area','proc','brd','demo'].forEach(function (k) { if (!clean[k]) throw new Error('Please fill in: ' + lbl_(k) + '.'); });
      let max = 0, rowNum = L.hr + 1;
      all.rows.forEach(function (r) {
        const mm = /(\d+)\s*$/.exec(r.req); if (mm) max = Math.max(max, +mm[1]);
        if (r.row >= rowNum) rowNum = r.row + 1;
      });
      const id = 'REQ_' + (max + 1);
      if (rowNum > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), rowNum - sh.getMaxRows());
      const vals = Object.assign({}, clean, {
        req: id, status: clean.status || 'Pending',
        respName: String(rec.responder || m.name || '').trim().slice(0, 120), respEmail: m.email,
        logged: now, updated: now, deleted: ''
      });
      try { setCells_(sh, L, rowNum, vals); }
      catch (err) { clearRow_(sh, L, rowNum, Object.keys(vals)); throw new Error('Nothing was saved. ' + friendly_(err.message)); }
      const nm = String(rec.responder || '').trim().slice(0, 120);
      if (nm && nm !== m.name) setName_(m.email, nm);   // keep the profile name current
      log_(m.email, 'Created', id, '', '', clean.name, 'Web app');
      bump_();
      return { ok: true, req: id };
    }
    const cur = all.rows.filter(function (r) { return r.req === rec.req; })[0];
    if (!cur) throw new Error('That requirement no longer exists.');
    if (cur.updated && rec.base && !sameStamp_(cur.updated, rec.base)) {
      return { ok: false, code: 'conflict', msg: 'Someone changed ' + cur.req + ' while you were editing. Your changes were not saved. The latest version has been loaded.' };
    }
    const clean = clean_(rec, cur), changes = {};
    Object.keys(clean).forEach(function (k) { if (String(cur[k]) !== clean[k]) changes[k] = clean[k]; });
    if (!Object.keys(changes).length) return { ok: true, req: cur.req, nochange: true };
    try { setCells_(sh, L, cur.row, Object.assign({}, changes, { updated: now })); }
    catch (err) { restoreRow_(sh, L, cur, Object.keys(changes).concat(['updated'])); throw new Error('Nothing was changed. ' + friendly_(err.message)); }
    Object.keys(changes).forEach(function (k) { log_(m.email, 'Edited', cur.req, HDR_[k], cur[k], changes[k], 'Web app'); });
    bump_();
    return { ok: true, req: cur.req };
  });
}
function deleteRequirement(req) {
  const m = need_('editor');
  return withLock_(function () {
    const all = readAll_(), L = ensureCols_(all.sh), cur = all.rows.filter(function (r) { return r.req === req; })[0];
    if (!cur) throw new Error('Requirement not found.');
    setCells_(all.sh, L, cur.row, { deleted: 'Y', updated: new Date() });
    log_(m.email, 'Deleted', req, '', '', cur.name, 'Web app'); bump_();
    return { ok: true };
  });
}
function restoreRequirement(req) {
  const m = need_('owner');
  return withLock_(function () {
    const all = readAll_(), L = ensureCols_(all.sh), cur = all.rows.filter(function (r) { return r.req === req; })[0];
    if (!cur) throw new Error('Requirement not found.');
    setCells_(all.sh, L, cur.row, { deleted: '', updated: new Date() });
    log_(m.email, 'Restored', req, '', '', cur.name, 'Web app'); bump_();
    return { ok: true };
  });
}

/* ------------------------------ API: access -------------------------------- */
function setName_(email, name) {
  const r = accRows_().filter(function (x) { return x.email === email; })[0];
  if (r) { r.name = name; putAcc_(r); }
}
function requestAccess(name, role, reason) {
  const email = String(Session.getActiveUser().getEmail() || '').toLowerCase();
  if (!email) throw new Error('We could not read your Google account. Please sign in with your company Google account.');
  role = String(role).toLowerCase();
  if (!RANK_[role]) throw new Error('Please choose Viewer, Editor or Owner.');
  name = String(name || '').trim().slice(0, 120); reason = String(reason || '').trim().slice(0, 500);
  if (!name || !reason) throw new Error('Please add your name and why you need access.');
  return withLock_(function () {
    const cur = accRows_().filter(function (r) { return r.email === email; })[0];
    if (cur && cur.status === 'Active') return { ok: true, already: true };
    putAcc_({ email: email, name: name, role: '', status: 'Pending', reqRole: role, reason: reason, reqAt: new Date().toISOString() });
    log_(email, 'Access requested', '', 'Role', '', cap_(role), 'Web app');
    const owners = accRows_().filter(function (r) { return r.role === 'owner' && r.status === 'Active'; }).map(function (r) { return r.email; });
    if (owners.length) mail_(owners.join(','), 'Access request from ' + name,
      '<p><b>' + name + '</b> (' + email + ') asked for the <b>' + cap_(role) + '</b> role.</p><p>Reason: ' + reason.replace(/</g, '&lt;') + '</p><p><a href="' + appUrl_() + '">Open the app to approve or decline</a></p>');
    return { ok: true };
  });
}
function updateName(email, name) {
  const m = need_('viewer'); email = String(email).toLowerCase();
  name = String(name || '').trim().slice(0, 120);
  if (!name) throw new Error('Please enter a name.');
  if (email !== m.email && m.role !== 'owner') throw new Error('You can only change your own name.');
  return withLock_(function () {
    const r = accRows_().filter(function (x) { return x.email === email; })[0];
    if (!r) throw new Error('User not found.');
    const old = r.name; r.name = name; putAcc_(r);
    log_(m.email, 'Name changed', '', email, old, name, 'Web app');
    return { ok: true };
  });
}
function addUser(email, name, role, notify) {
  const m = need_('owner');
  email = String(email || '').trim().toLowerCase();
  name = String(name || '').trim().slice(0, 120);
  role = String(role || '').toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Please enter a valid email address, for example name@example.com.');
  if (!RANK_[role]) throw new Error('Please choose Viewer, Editor or Owner.');
  return withLock_(function () {
    const cur = accRows_().filter(function (x) { return x.email === email; })[0];
    if (cur && cur.status === 'Active') throw new Error(email + ' already has access as ' + cur.role + '. Use the role menu in the list to change it.');
    putAcc_({ email: email, name: name || (cur ? cur.name : ''), role: role, status: 'Active', reqRole: role,
      reason: (cur && cur.reason) ? cur.reason : 'Added by an Owner', reqAt: cur ? cur.reqAt : '', by: m.email, at: new Date().toISOString() });
    log_(m.email, 'User added', '', email, '', cap_(role), 'Web app');
    if (notify) mail_(email, 'You now have access', '<p>You have been given the <b>' + cap_(role) + '</b> role in the ' + CFG.APP_NAME + '.</p><p><a href="' + appUrl_() + '">Open the app</a></p>');
    return { ok: true };
  });
}
function listAccess() { need_('owner'); return accRows_(); }
function decideAccess(email, decision, role) {
  const m = need_('owner'); email = String(email).toLowerCase();
  return withLock_(function () {
    const r = accRows_().filter(function (x) { return x.email === email; })[0];
    if (!r) throw new Error('Request not found.');
    const approve = decision === 'approve'; role = String(role || r.reqRole || 'viewer').toLowerCase();
    if (approve && !RANK_[role]) throw new Error('That role is not recognised. Choose Viewer, Editor or Owner.');
    r.status = approve ? 'Active' : 'Declined'; r.role = approve ? role : ''; r.by = m.email; r.at = new Date().toISOString();
    putAcc_(r);
    log_(m.email, approve ? 'Access approved' : 'Access declined', '', 'User', email, approve ? cap_(role) : '', 'Web app');
    mail_(email, approve ? 'Your access was approved' : 'Your access request was declined',
      approve ? '<p>You now have the <b>' + cap_(role) + '</b> role.</p><p><a href="' + appUrl_() + '">Open the app</a></p>' : '<p>Your request was declined. Please contact the owner if you think this is a mistake.</p>');
    return { ok: true };
  });
}
function setRole(email, role) {
  const m = need_('owner'); email = String(email).toLowerCase(); role = String(role).toLowerCase();
  if (!RANK_[role]) throw new Error('That role is not recognised. Choose Viewer, Editor or Owner.');
  return withLock_(function () {
    const rows = accRows_(), r = rows.filter(function (x) { return x.email === email; })[0];
    if (!r || r.status !== 'Active') throw new Error('User not found.');
    const owners = rows.filter(function (x) { return x.role === 'owner' && x.status === 'Active'; });
    if (r.role === 'owner' && role !== 'owner' && owners.length < 2) throw new Error('There must always be at least one Owner.');
    const old = r.role; r.role = role; r.by = m.email; r.at = new Date().toISOString(); putAcc_(r);
    log_(m.email, 'Role changed', '', email, cap_(old), cap_(role), 'Web app');
    return { ok: true };
  });
}
function revokeAccess(email) {
  const m = need_('owner'); email = String(email).toLowerCase();
  return withLock_(function () {
    const rows = accRows_(), r = rows.filter(function (x) { return x.email === email; })[0];
    if (!r) throw new Error('User not found.');
    const owners = rows.filter(function (x) { return x.role === 'owner' && x.status === 'Active'; });
    if (r.role === 'owner' && owners.length < 2) throw new Error('There must always be at least one Owner.');
    const old = r.role; r.status = 'Revoked'; r.role = ''; r.by = m.email; r.at = new Date().toISOString(); putAcc_(r);
    log_(m.email, 'Access revoked', '', email, cap_(old), '', 'Web app');
    return { ok: true };
  });
}

/* ------------------------------ API: audit log ----------------------------- */
function getLog() {
  need_('owner');
  const sh = logSheet_(), n = sh.getLastRow() - 1;
  if (n < 1) return [];
  const from = Math.max(2, sh.getLastRow() - 499);
  return sh.getRange(from, 1, sh.getLastRow() - from + 1, LOG_H.length).getValues().reverse().map(function (r) {
    return { at: iso_(r[0]), user: r[1], action: r[2], req: r[3], field: r[4], oldV: String(r[5]), newV: String(r[6]), source: r[7] };
  });
}

/* ------------------------------ sheet-side edits --------------------------- */
// Installed by setup() as an installable "on edit" trigger.
function onSheetEdit(e) {
  try {
    const sh = e.range.getSheet();
    if (sh.getName() !== CFG.REQ_SHEET) return;
    const L = layout_(sh), r1 = e.range.getRow(), r2 = e.range.getLastRow();
    if (r2 <= L.hr) return;
    const c1 = e.range.getColumn(), c2 = e.range.getLastColumn();
    const user = (e.user && e.user.getEmail()) || Session.getActiveUser().getEmail() || 'unknown';
    const reqC = col_(L, 'REQ #'), upC = col_(L, 'LAST UPDATED'), lgC = col_(L, 'LOGGED ON'), emC = col_(L, 'RESPONDER EMAIL');
    const start = Math.max(r1, L.hr + 1), now = new Date();
    const reqOf = function (r) { return reqC ? String(sh.getRange(r, reqC).getValue() || '') : ''; };
    if (r1 === r2 && c1 === c2) {
      const hdr = String(sh.getRange(L.hr, c1).getValue() || ('Column ' + c1));
      log_(user, 'Edited', reqOf(r1), hdr, e.oldValue, e.value, 'Google Sheet');
    } else {
      log_(user, 'Bulk edit', '', 'Rows ' + start + '-' + r2, '', (r2 - start + 1) + ' rows x ' + (c2 - c1 + 1) + ' columns', 'Google Sheet');
    }
    // Only a NEW row (the REQ # cell is part of the edit) gets its logged-on date and email filled in.
    // Editing or clearing LOGGED ON by hand, or editing any other cell of an older row, never re-stamps it.
    const touchesReq = reqC && reqC >= c1 && reqC <= c2;
    const touchesLogged = lgC && lgC >= c1 && lgC <= c2;
    for (let r = start; r <= r2; r++) {
      if (!reqOf(r)) continue;
      if (upC) sh.getRange(r, upC).setValue(now);
      if (touchesReq && !touchesLogged) {
        if (lgC && !sh.getRange(r, lgC).getValue()) sh.getRange(r, lgC).setValue(now);
        if (emC && !sh.getRange(r, emC).getValue()) sh.getRange(r, emC).setValue(user);
      }
    }
    bump_();
  } catch (err) { console.error(err); }
}

/* ------------------------------ built-in process guide (sample hierarchy: replace with your own) ------------------------------ */
// Used only until you fill the "Process Guide" tab. [L1 end-to-end process, L2 process area, L3 process, L4 activity / task]
const GUIDE_SNAPSHOT = [
  ["Plan to Fulfill", "Planning", "Demand planning", "Forecast review and consensus"],
  ["Plan to Fulfill", "Planning", "Supply planning", "Supply plan and capacity check"],
  ["Plan to Fulfill", "Order Fulfillment", "Order promising", "Availability check and ship-date confirmation"],
  ["Plan to Fulfill", "Order Fulfillment", "Order processing", "Order entry, changes and status tracking"],
  ["Plan to Fulfill", "Logistics", "Outbound delivery", "Delivery creation, picking and goods issue"],
  ["Plan to Fulfill", "Logistics", "Shipping and receiving", "Carrier booking, tracking and receipt"],
  ["Plan to Fulfill", "Trade Compliance", "Export compliance", "Screening, classification and customs documents"],
  ["Plan to Fulfill", "Returns", "Returns handling", "Return authorization, receipt and disposition"],
  ["Master Data", "Master Data", "Material and BOM", "Product records and versions"],
  ["Master Data", "Master Data", "Customer and partner", "Customer, ship-to and partner records"],
  ["Procure to Pay", "Procurement", "Purchase orders", "Purchase order creation, approval and receipt"],
  ["Finance", "Finance", "Inventory accounting", "Inventory valuation and adjustments"]
];
