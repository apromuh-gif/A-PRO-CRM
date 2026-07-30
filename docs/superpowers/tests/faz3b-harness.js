const fs = require('fs');
const path = require('path');
const HTML = path.join(__dirname, '..', '..', '..', 'APRO_CRM_Firebase.html');

// Frozen kopyalar — stabil düşük seviye tarih yardımcıları (drift etmez).
const DEPS = `
const today = () => new Date().toISOString().slice(0,10);
function _toISO(d){ if(!d) return null; d=d.trim(); if(/^\\d{4}-\\d{2}-\\d{2}/.test(d)) return d.substring(0,10); const p=d.split('.'); if(p.length===3) return p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'); return d; }
function _toDate(d){ const iso=_toISO(d); if(!iso) return null; const parts=iso.split('-'); if(parts.length!==3) return null; return new Date(parseInt(parts[0]),parseInt(parts[1])-1,parseInt(parts[2])); }
function _diffDaysDate(d){ const date=_toDate(d); if(!date) return 9999; const t=new Date(); t.setHours(0,0,0,0); date.setHours(0,0,0,0); return Math.round((date-t)/(1000*60*60*24)); }
function _diffDays(d){ return _diffDaysDate(d); }
`;

function extract(src, name){
  const re = new RegExp('\\nfunction ' + name + '\\s*\\(');
  const m = re.exec(src);
  if(!m) throw new Error('function not found in HTML: ' + name);
  const start = m.index + 1;
  let depth = 0, j = src.indexOf('{', start);
  for(; j < src.length; j++){
    const ch = src[j];
    if(ch === '{') depth++;
    else if(ch === '}'){ depth--; if(depth === 0){ j++; break; } }
  }
  return src.slice(start, j);
}

function load(names){
  const src = fs.readFileSync(HTML, 'utf8');
  const bodies = names.map(n => extract(src, n)).join('\n');
  const ret = '({' + names.join(',') + '})';
  return new Function(DEPS + '\n' + bodies + '\nreturn ' + ret + ';')();
}

module.exports = { load };
