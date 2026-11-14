(() => {
  'use strict';
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function equal(a, b) {
    if (a === b) return true;
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equal(v, b[i]));
    if (!object(a) || !object(b)) return false;
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every(k => Object.hasOwn(b, k) && equal(a[k], b[k]));
  }
  function reconcile(base, local, server, preferServer = false) {
    const conflicts = [];
    function merge(before, mine, theirs, path) {
      if (equal(mine, before)) return theirs;
      if (equal(theirs, before) || equal(mine, theirs)) return mine;
      const field = path.at(-1);
      if (field === 'updatedAt' && typeof mine === 'string' && typeof theirs === 'string') return mine > theirs ? mine : theirs;
      if (object(mine) && object(theirs) && (before === undefined || object(before))) {
        const result = Object.create(null);
        for (const key of new Set([...Object.keys(mine), ...Object.keys(theirs)])) {
          if (key === 'band' && ('score' in mine || 'score' in theirs) && window.BAMCO_REVIEW_CONTRACT) continue;
          const value = merge(before?.[key], mine[key], theirs[key], [...path, key]);
          if (value !== undefined) result[key] = value;
        }
        if (('band' in mine || 'band' in theirs) && ('score' in mine || 'score' in theirs) && window.BAMCO_REVIEW_CONTRACT) result.band = window.BAMCO_REVIEW_CONTRACT.band(result.score);
        return result;
      }
      if (Array.isArray(mine) && Array.isArray(theirs) && (before === undefined || Array.isArray(before))) {
        if (field === 'customTests' && [...(before || []), ...mine, ...theirs].every(t => typeof t?.id === 'string')) {
          const index = items => new Map(items.map(t => [t.id, t]));
          const original = index(before || []), a = index(mine), b = index(theirs);
          return [...new Set([...b.keys(), ...a.keys()])].map(id => merge(original.get(id), a.get(id), b.get(id), [...path,id])).filter(Boolean);
        }
        if (path.join('/') === 'missions/audit:general/entries') {
          // The audit log is append-only and capped. Union events independent of JSONB key order.
          const key = event => JSON.stringify(event, Object.keys(event).sort());
          return [...new Map([...theirs, ...mine].map(event => [key(event), event])).values()].sort((a,b) => String(a.at).localeCompare(String(b.at))).slice(-2000);
        }
      }
      conflicts.push({path, mine, theirs});
      return preferServer ? theirs : mine;
    }
    const snapshot = merge(base, local, server, []);
    return {snapshot, conflicts};
  }
  window.BAMCO_RECONCILE = reconcile;
})();
