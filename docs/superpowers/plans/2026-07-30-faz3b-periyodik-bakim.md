# Faz 3b — Periyodik Bakım Takip Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `maintenances` koleksiyonuna periyot/tekrar (recurrence) vade takibi ekle; her tamamlanan bakım bir sonraki vadeyi türetsin ve mevcut (ölü) hatırlatma altyapısı bu vadeye bağlansın.

**Architecture:** Faz 3a/2 desenini izler ama aşama motoru **yok** — vade ekseni. `maintenances` kaydına okuma-anı default'lu alanlar (`mtPeriod/mtPeriodDays/mtNextDue/mtLastDone/mtHistory`) eklenir. Saf tarih/vade fonksiyonları tek bir `FAZ 3b` bloğunda toplanır (satır ~6684'ten sonra, `// ================= /FAZ 3a =================` işaretinden hemen sonra). UI: `buildMaintModal` genişletilir, `renderMaintenances` sekmeleri (Tümü/Yaklaşan/Geciken), geçmiş modalı `buildBakimModal`. Durum ekseni (`Hizmet Verildi/Verilmedi`) dokunulmaz; ORTAK koleksiyon olduğu için `filterFY` uygulanmaz.

**Tech Stack:** Tek dosya `APRO_CRM_Firebase.html` (Firebase Firestore + Vanilla JS, custom vDOM `h()`). Test altyapısı yok → Node harness ile saf-fonksiyon unit testi + `node vm.Script` syntax-check + manuel tarayıcı doğrulaması.

**Spec:** `docs/superpowers/specs/2026-07-30-faz3b-periyodik-bakim-design.md`

---

## Dosya Yapısı

| Dosya | Sorumluluk | İşlem |
|---|---|---|
| `APRO_CRM_Firebase.html` | Tüm uygulama (tek dosya) | Modify — FAZ 3b bloğu + modal + render + rewire |
| `docs/superpowers/tests/syntax.sh` | CLAUDE.md syntax-check komutu (tekrar kullanılır) | Create |
| `docs/superpowers/tests/faz3b-harness.js` | HTML'den isimle fonksiyon çıkarıp eval eden test harness | Create |
| `docs/superpowers/tests/_assert.js` | Minimal assert (eq/done) | Create |
| `docs/superpowers/tests/faz3b-addmonth.test.js` | `_addMonth`/`_addDay` testleri | Create |
| `docs/superpowers/tests/faz3b-nextdue.test.js` | `computeNextDue` testleri | Create |
| `docs/superpowers/tests/faz3b-duestatus.test.js` | `maintIsTracked`/`maintDueStatus`/`maintDaysLeft` testleri | Create |

`APRO_CRM_Firebase.html` içindeki tüm FAZ 3b saf fonksiyonları **tek blok** olarak eklenir (satır ~6684). Bu, "birlikte değişen kod birlikte yaşar" ilkesini korur ve harness'in tek yerden çıkarmasını kolaylaştırır.

---

## Task 1: Test tooling (syntax script + harness + assert)

**Files:**
- Create: `docs/superpowers/tests/syntax.sh`
- Create: `docs/superpowers/tests/faz3b-harness.js`
- Create: `docs/superpowers/tests/_assert.js`

- [ ] **Step 1: Create the syntax-check script**

Create `docs/superpowers/tests/syntax.sh` (CLAUDE.md'deki komutun script hâli — sonraki tüm task'lar bunu çağırır):

```bash
#!/usr/bin/env bash
# APRO_CRM_Firebase.html ana <script> bloğunu vm.Script ile derleyerek JS syntax doğrular.
cd "$(dirname "$0")/../../.." || exit 1
node -e "
const fs=require('fs');
const html=fs.readFileSync('APRO_CRM_Firebase.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const main=scripts.filter(s=>s[1].length>1000).pop();
const vm=require('vm');
try{new vm.Script(main[1]);console.log('✅ SYNTAX OK');}
catch(e){console.log('❌',e.message);process.exit(1);}
"
```

- [ ] **Step 2: Create the assert helper**

Create `docs/superpowers/tests/_assert.js`:

```js
let failures = 0;
function eq(actual, expected, msg){
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if(a === e){ console.log('  ✓ ' + msg); }
  else { failures++; console.log('  ✗ ' + msg + '\n      expected ' + e + '\n      got      ' + a); }
}
function done(){
  if(failures){ console.log('\n❌ ' + failures + ' test(s) failed'); process.exit(1); }
  console.log('\n✅ all passed'); process.exit(0);
}
module.exports = { eq, done };
```

- [ ] **Step 3: Create the extraction harness**

Create `docs/superpowers/tests/faz3b-harness.js`. Çıkarıcı, `\nfunction NAME(` ile başlayıp süslü parantezleri dengeleyerek fonksiyon gövdesini alır. Düşük seviye tarih yardımcıları (regex içinde `{n}` süslü parantez barındırdığından çıkarımı bozar) **enjekte** edilir; yalnızca yeni FAZ 3b fonksiyonları HTML'den çıkarılır:

```js
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
```

- [ ] **Step 4: Verify the tooling loads**

Run: `chmod +x docs/superpowers/tests/syntax.sh && bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK` (henüz FAZ 3b eklenmedi — mevcut dosya derlenmeli)

Run: `node -e "require('./docs/superpowers/tests/faz3b-harness.js'); require('./docs/superpowers/tests/_assert.js'); console.log('modules ok')"`
Expected: `modules ok`

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/tests/syntax.sh docs/superpowers/tests/_assert.js docs/superpowers/tests/faz3b-harness.js
git commit -m "test: Faz 3b test tooling (syntax script + extraction harness + assert)"
```

---

## Task 2: FAZ 3b bloğu — tarih yardımcıları + erişimciler

**Files:**
- Modify: `APRO_CRM_Firebase.html` (insert after line ~6684)
- Test: `docs/superpowers/tests/faz3b-addmonth.test.js`

- [ ] **Step 1: Write the failing test**

Create `docs/superpowers/tests/faz3b-addmonth.test.js`:

```js
const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
const { _addMonth, _addDay } = load(['_ymd','_addMonth','_addDay']);

eq(_addMonth('2026-01-15', 1),  '2026-02-15', 'ay ekle normal');
eq(_addMonth('2026-01-31', 1),  '2026-02-28', 'ay sonu clamp (28)');
eq(_addMonth('2024-01-31', 1),  '2024-02-29', 'artık yıl Şubat clamp (29)');
eq(_addMonth('2026-11-30', 3),  '2027-02-28', 'yıl sınırı + clamp');
eq(_addMonth('2026-01-15', 12), '2027-01-15', 'yıl ekle');
eq(_addMonth('', 1),            '',           'boş girdi');
eq(_addDay('2026-01-15', 20),   '2026-02-04', 'gün ekle ay taşması');
eq(_addDay('2026-12-25', 10),   '2027-01-04', 'gün ekle yıl taşması');
done();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node docs/superpowers/tests/faz3b-addmonth.test.js`
Expected: FAIL — `Error: function not found in HTML: _ymd`

- [ ] **Step 3: Write minimal implementation**

`APRO_CRM_Firebase.html` içinde şu satırı bul (satır ~6684):

```
// ================= /FAZ 3a =================
```

Bu satırın **hemen altına** aşağıdaki bloğu ekle (yani `// ================= /FAZ 3a =================\n` → aynı satır + yeni blok):

```javascript
// ================= FAZ 3b: PERİYODİK BAKIM VADE/TEKRAR =================
// Periyot seçenekleri (UI + etiket kaynağı).
const MAINT_PERIODS = [
  {v:'',       l:'Takip yok'},
  {v:'aylik',  l:'Aylık'},
  {v:'3aylik', l:'3 Aylık'},
  {v:'6aylik', l:'6 Aylık'},
  {v:'yillik', l:'Yıllık'},
  {v:'ozel',   l:'Özel (gün)'},
];
// Tarih yardımcıları — timezone-safe, baz tarihe göreli (bugüne değil).
function _ymd(dt){ return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0'); }
function _addDay(iso, n){ const dt=_toDate(iso); if(!dt) return ''; dt.setDate(dt.getDate()+Number(n)); return _ymd(dt); }
function _addMonth(iso, n){ const dt=_toDate(iso); if(!dt) return ''; const d0=dt.getDate(); dt.setDate(1); dt.setMonth(dt.getMonth()+Number(n)); const last=new Date(dt.getFullYear(), dt.getMonth()+1, 0).getDate(); dt.setDate(Math.min(d0, last)); return _ymd(dt); }
// Okuma-anı default'lu güvenli erişimciler (mevcut kayıtları bozmaz).
function maintPeriod(m){ return (m && m.mtPeriod) || ''; }
function maintPeriodDays(m){ return (m && Number(m.mtPeriodDays)) || 0; }
function maintNextDue(m){ return (m && m.mtNextDue) || ''; }
function maintLastDone(m){ return (m && m.mtLastDone) || ''; }
function maintHistory(m){ return (m && Array.isArray(m.mtHistory)) ? m.mtHistory : []; }
function maintIsTracked(m){ return !!(m && m.mtPeriod && m.mtNextDue); }
function maintPeriodLabel(p){ const o=MAINT_PERIODS.find(x=>x.v===p); return o ? o.l : ''; }
// ================= /FAZ 3b =================
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node docs/superpowers/tests/faz3b-addmonth.test.js`
Expected: `✅ all passed`

- [ ] **Step 5: Run syntax check**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html docs/superpowers/tests/faz3b-addmonth.test.js
git commit -m "feat: Faz 3b tarih yardımcıları + bakım erişimcileri (_addMonth/_addDay/maint*)"
```

---

## Task 3: `computeNextDue` — periyottan sonraki vade

**Files:**
- Modify: `APRO_CRM_Firebase.html` (FAZ 3b bloğu içine)
- Test: `docs/superpowers/tests/faz3b-nextdue.test.js`

- [ ] **Step 1: Write the failing test**

Create `docs/superpowers/tests/faz3b-nextdue.test.js`:

```js
const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
const { computeNextDue } = load(['_ymd','_addMonth','_addDay','computeNextDue']);

eq(computeNextDue('2026-01-15','aylik',0),  '2026-02-15','aylik +1 ay');
eq(computeNextDue('2026-01-15','3aylik',0), '2026-04-15','3aylik +3 ay');
eq(computeNextDue('2026-01-15','6aylik',0), '2026-07-15','6aylik +6 ay');
eq(computeNextDue('2026-01-15','yillik',0), '2027-01-15','yillik +12 ay');
eq(computeNextDue('2026-01-15','ozel',45),  '2026-03-01','ozel +45 gün');
eq(computeNextDue('2026-01-31','aylik',0),  '2026-02-28','aylik ay-sonu clamp');
eq(computeNextDue('2026-01-15','ozel',0),   '','ozel ama gün 0 → boş');
eq(computeNextDue('2026-01-15','',0),       '','periyot yok → boş');
eq(computeNextDue('','aylik',0),            '','baz tarih yok → boş');
done();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node docs/superpowers/tests/faz3b-nextdue.test.js`
Expected: FAIL — `Error: function not found in HTML: computeNextDue`

- [ ] **Step 3: Write minimal implementation**

`APRO_CRM_Firebase.html` içinde `function maintPeriodLabel(p){ ... }` satırını bul; bu satırın **hemen altına** ekle (yani `maintPeriodLabel` ile `// ================= /FAZ 3b =================` arasına):

```javascript
// Periyot + baz tarihten sonraki vadeyi hesaplar (takvim-doğru).
function computeNextDue(baseISO, period, days){
  if(!baseISO) return '';
  switch(period){
    case 'aylik':  return _addMonth(baseISO, 1);
    case '3aylik': return _addMonth(baseISO, 3);
    case '6aylik': return _addMonth(baseISO, 6);
    case 'yillik': return _addMonth(baseISO, 12);
    case 'ozel':   return (Number(days) > 0) ? _addDay(baseISO, Number(days)) : '';
    default:       return '';
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node docs/superpowers/tests/faz3b-nextdue.test.js`
Expected: `✅ all passed`

- [ ] **Step 5: Run syntax check**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html docs/superpowers/tests/faz3b-nextdue.test.js
git commit -m "feat: Faz 3b computeNextDue — periyottan sonraki vade hesabı"
```

---

## Task 4: Vade durumu — `maintDueStatus` + `maintDaysLeft`

**Files:**
- Modify: `APRO_CRM_Firebase.html` (FAZ 3b bloğu içine)
- Test: `docs/superpowers/tests/faz3b-duestatus.test.js`

- [ ] **Step 1: Write the failing test**

Create `docs/superpowers/tests/faz3b-duestatus.test.js`:

```js
const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
const { maintIsTracked, maintDueStatus, maintDaysLeft } = load([
  'maintPeriod','maintPeriodDays','maintNextDue','maintLastDone','maintHistory',
  'maintIsTracked','maintDueStatus','maintDaysLeft'
]);

// bugüne göreli ISO tarih üret
const iso = n => { const d=new Date(); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };

eq(maintIsTracked({}),                                    false,      'takipsiz: alan yok');
eq(maintIsTracked({mtPeriod:'aylik'}),                    false,      'takipsiz: nextDue yok');
eq(maintIsTracked({mtPeriod:'aylik', mtNextDue:iso(5)}),  true,       'takipte');
eq(maintDueStatus({}),                                    '',         'takipsiz → status boş');
eq(maintDueStatus({mtPeriod:'aylik', mtNextDue:iso(-3)}), 'geciken',  'vade 3 gün geçmiş');
eq(maintDueStatus({mtPeriod:'aylik', mtNextDue:iso(10)}), 'yaklasan', '10 gün kaldı');
eq(maintDueStatus({mtPeriod:'aylik', mtNextDue:iso(15)}), 'yaklasan', 'sınır 15 gün dahil');
eq(maintDueStatus({mtPeriod:'aylik', mtNextDue:iso(30)}), 'planli',   '30 gün → planlı');
eq(maintDaysLeft({mtPeriod:'aylik', mtNextDue:iso(7)}),   7,          'kalan 7 gün');
eq(maintDaysLeft({}),                                     null,       'takipsiz → null');
done();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node docs/superpowers/tests/faz3b-duestatus.test.js`
Expected: FAIL — `Error: function not found in HTML: maintDueStatus`

- [ ] **Step 3: Write minimal implementation**

`APRO_CRM_Firebase.html` içinde `computeNextDue` fonksiyonunun kapanış `}` satırının **hemen altına** ekle (yani `computeNextDue` ile `// ================= /FAZ 3b =================` arasına):

```javascript
// Vade durumu: geciken (<0) / yaklasan (0–15 gün) / planli (>15) / '' (takipsiz).
function maintDueStatus(m){
  if(!maintIsTracked(m)) return '';
  const dl = _diffDays(maintNextDue(m));
  if(dl < 0) return 'geciken';
  if(dl <= 15) return 'yaklasan';
  return 'planli';
}
function maintDaysLeft(m){ return maintIsTracked(m) ? _diffDays(maintNextDue(m)) : null; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node docs/superpowers/tests/faz3b-duestatus.test.js`
Expected: `✅ all passed`

- [ ] **Step 5: Run syntax check**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html docs/superpowers/tests/faz3b-duestatus.test.js
git commit -m "feat: Faz 3b maintDueStatus/maintDaysLeft — vade durum sınıflandırma"
```

---

## Task 5: `maintDone` — bakım tamamlama döngüsü

**Files:**
- Modify: `APRO_CRM_Firebase.html` (FAZ 3b bloğu içine)

Not: `maintDone` impure (prompt/setState/saveDoc) — unit test edilmez; syntax + manuel doğrulama. Kayıt yolu `saveMaint` deseniyle birebir aynıdır (`saveDoc` + `state.maintenances.map` + `...stamp()` → `_editedBy/_editedAt`).

- [ ] **Step 1: Write the implementation**

`APRO_CRM_Firebase.html` içinde `function maintDaysLeft(m){ ... }` satırının **hemen altına** ekle (yani `maintDaysLeft` ile `// ================= /FAZ 3b =================` arasına):

```javascript
// Bakım tamamla: geçmişe ekle, son yapılanı işaretle, sonraki vadeyi ileri sar,
// durumu yeni döngü için "Henüz Verilmedi"ye geri al. Kayıt: saveMaint deseni.
async function maintDone(m){
  if(!maintIsTracked(m)){ showToast('⚠️ Önce periyot ve ilk vade tarihi girin.','#d97706'); return; }
  const note = prompt('Bakım tamamlandı — yapılan işlem / not (opsiyonel):', '');
  if(note === null) return;
  const me = (state.currentUser && state.currentUser.displayName) || '';
  const now = today();
  const hist = [...maintHistory(m), {at:now, by:me, note:note||''}];
  const nextDue = computeNextDue(now, maintPeriod(m), maintPeriodDays(m));
  const data = {...m, mtLastDone:now, mtHistory:hist, mtNextDue:nextDue, status:'Hizmet Henüz Verilmedi', ...stamp()};
  setState({saving:true});
  await saveDoc('maintenances', m.id, data);
  const list = state.maintenances.map(x => x.id===m.id ? data : x);
  setState({maintenances:list, modal:null, saving:false});
  showToast('✅ Bakım tamamlandı — sonraki vade: ' + (nextDue ? _toTR(nextDue) : '-'));
}
```

- [ ] **Step 2: Run syntax check**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Verify existing pure-function tests still pass (regression)**

Run: `node docs/superpowers/tests/faz3b-addmonth.test.js && node docs/superpowers/tests/faz3b-nextdue.test.js && node docs/superpowers/tests/faz3b-duestatus.test.js`
Expected: her biri `✅ all passed`

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat: Faz 3b maintDone — tamamlama + vade ilerletme + durum reset"
```

---

## Task 6: `buildMaintModal` — periyot seçici + ilk vade + Tamamla butonu

**Files:**
- Modify: `APRO_CRM_Firebase.html:1859-1889`

- [ ] **Step 1: Write the implementation — default objeye alanlar ekle**

`APRO_CRM_Firebase.html:1860` mevcut satır:

```javascript
  const f = item ? JSON.parse(JSON.stringify(item)) : {jobName:'',customerId:'',serviceContact:'',amount:'',status:'Hizmet Henüz Verilmedi',appointmentStart:'',appointmentEnd:'',notes:'',createdAt:today()};
```

Şununla değiştir (yeni default alanlar `mtPeriod/mtPeriodDays/mtNextDue`):

```javascript
  const f = item ? JSON.parse(JSON.stringify(item)) : {jobName:'',customerId:'',serviceContact:'',amount:'',status:'Hizmet Henüz Verilmedi',appointmentStart:'',appointmentEnd:'',notes:'',mtPeriod:'',mtPeriodDays:'',mtNextDue:'',createdAt:today()};
```

- [ ] **Step 2: Write the implementation — periyot alanlarını ve butonları ekle**

`APRO_CRM_Firebase.html:1867-1868` mevcut iki satır (randevu input'ları):

```javascript
  const fStart=inp('',f.appointmentStart||'',v=>f.appointmentStart=v,'date');
  const fEnd=inp('',f.appointmentEnd||'',v=>f.appointmentEnd=v,'date');
```

Bu iki satırın **hemen altına** ekle:

```javascript
  const fPeriod=sel(MAINT_PERIODS, f.mtPeriod||'', v=>{ f.mtPeriod=v; setState({modal:{type:'maintenance',item:JSON.parse(JSON.stringify(f))}}); });
  const fDays=inp('gün (örn. 90)', f.mtPeriodDays||'', v=>f.mtPeriodDays=v, 'number');
  const fNext=inp('', f.mtNextDue||'', v=>f.mtNextDue=v, 'date');
```

Not: periyot değişince `mtPeriodDays` alanının görünürlüğü yeniden hesaplanması için modal state'i tazelenir (mevcut CRM'de modal alanları setState ile yeniden çizilir).

- [ ] **Step 3: Write the implementation — modal içeriğine periyot kutusu ekle**

`APRO_CRM_Firebase.html:1879-1882` mevcut blok (Randevu Tarihi Aralığı kutusu):

```javascript
    h('div',{style:{background:G,border:`1px solid ${G3}`,borderRadius:'10px',padding:'14px',marginBottom:'11px'}},
      lbl('Randevu Tarihi Aralığı'),
      row(field('Başlangıç',fStart,true),field('Bitiş',fEnd,true))
    ),
```

Bu bloğun **hemen altına** ekle (periyot/vade kutusu):

```javascript
    h('div',{style:{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'14px',marginBottom:'11px'}},
      lbl('🔁 Periyodik Bakım Takibi'),
      row(
        field('Periyot',fPeriod,true),
        (f.mtPeriod==='ozel') ? field('Periyot (gün)',fDays,true) : h('div',{style:{flex:'1 1 45%'}})
      ),
      field('Sonraki Bakım Vadesi',fNext),
      h('div',{style:{fontSize:'11px',color:'#15803d'}},'ℹ️ Vade, her bakım tamamlandığında periyot kadar otomatik ileri sarılır. Randevu aralığından bağımsızdır.')
    ),
```

- [ ] **Step 4: Write the implementation — düzenlemede "Bakımı Tamamla" butonu**

`APRO_CRM_Firebase.html:1884-1887` mevcut buton satırı:

```javascript
    h('div',{style:{display:'flex',gap:'10px'}},
      btn('Kaydet',()=>saveMaint({...f,amount:Number(f.amount)||0},!!item),'linear-gradient(135deg,#10b981,#059669)','#fff','11px 16px',{flex:'1',fontSize:'14px'}),
      btn('İptal',()=>setState({modal:null}),'#21262d','#8b949e','11px 20px',{fontSize:'14px'})
    )
```

Şununla değiştir (takipteyken Tamamla + Geçmiş butonları görünür):

```javascript
    (item && maintIsTracked(f)) ? h('div',{style:{display:'flex',gap:'8px',marginBottom:'10px',flexWrap:'wrap'}},
      btn('✅ Bakımı Tamamla',()=>maintDone(item),'linear-gradient(135deg,#16a34a,#15803d)','#fff','10px 14px',{flex:'1',fontSize:'13px'}),
      maintHistory(item).length ? btn('🕘 Geçmiş ('+maintHistory(item).length+')',()=>setState({modal:{type:'bakim',maintId:item.id}}),'#eff6ff','#1d4ed8','10px 14px',{fontSize:'13px',border:'1px solid #bfdbfe'}) : h('span')
    ) : h('span'),
    h('div',{style:{display:'flex',gap:'10px'}},
      btn('Kaydet',()=>saveMaint({...f,amount:Number(f.amount)||0,mtPeriodDays:Number(f.mtPeriodDays)||0},!!item),'linear-gradient(135deg,#10b981,#059669)','#fff','11px 16px',{flex:'1',fontSize:'14px'}),
      btn('İptal',()=>setState({modal:null}),'#21262d','#8b949e','11px 20px',{fontSize:'14px'})
    )
```

- [ ] **Step 5: Run syntax check**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Manual verification (browser)**

Tarayıcıda: Periyodik Bakım → + Yeni. "Periyot" = Aylık seç → "Sonraki Bakım Vadesi" elle gir → Kaydet. Kaydı düzenle-aç → "✅ Bakımı Tamamla" butonu görünür. "Özel (gün)" seçince gün input'u belirir.

- [ ] **Step 7: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat: Faz 3b buildMaintModal — periyot seçici + vade + Bakımı Tamamla"
```

---

## Task 7: `renderMaintenances` — sekmeler (Tümü/Yaklaşan/Geciken) + vade rozeti

**Files:**
- Modify: `APRO_CRM_Firebase.html:716` (PMOD default)
- Modify: `APRO_CRM_Firebase.html:5716-5790` (renderMaintenances)

- [ ] **Step 1: PMOD default'a maintTab ekle**

`APRO_CRM_Firebase.html:716` mevcut satırın sonundaki `arizaTab:'tumu', arizaView:'liste' };` kısmını bul ve `maintTab` ekle:

```javascript
let PMOD = { taskFilter:'acik', taskAdd:false, draft:null, perfOpen:{}, primOpen:{}, settingsOpen:false, taskCtx:'hepsi', taskView:'liste', taskDept:'', taskPerson:'', projView:'liste', projDept:'', projPerson:'', projShowClosed:false, arizaTab:'tumu', arizaView:'liste', maintTab:'tumu' };
```

- [ ] **Step 2: renderMaintenances — sekme çubuğu + filtreli liste hesabı ekle**

`APRO_CRM_Firebase.html:5722-5727` mevcut `maintFiltered` bloğunun **hemen altına** (yani satır 5727 `});` sonrası, `maintFilterBox` tanımından önce) ekle:

```javascript
  const mTab=PMOD.maintTab||'tumu';
  const _due=st=>maintFiltered.filter(m=>maintDueStatus(m)===st);
  const upcomingM=_due('yaklasan');
  const overdueM=_due('geciken');
  const maintTabBar=h('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}},
    ...[['tumu','📋 Tümü',maintFiltered.length],['yaklasan','🟡 Yaklaşan',upcomingM.length],['geciken','🔴 Geciken',overdueM.length]].map(x=>
      btn(x[1]+' ('+x[2]+')',()=>{PMOD.maintTab=x[0];render();},mTab===x[0]?'#0e7490':'#e8eef7',mTab===x[0]?'#fff':'#2a5080','7px 13px',{fontSize:'12px'}))
  );
  const maintInfoNote=h('div',{style:{fontSize:'11px',color:T4,marginBottom:'10px'}},'ℹ️ Periyodik Bakım = yasal zorunlu tekrarlayan bakım vade takibi.');
  const maintDueRow=m=>{
    const stt=maintDueStatus(m), c=stt==='geciken'?'#dc2626':stt==='yaklasan'?'#d97706':'#16a34a';
    const dl=maintDaysLeft(m), cust=custById(m.customerId);
    return h('div',{style:{background:'#fff',border:'1px solid '+(stt==='geciken'?'#fca5a5':'#d0daea'),borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',display:'flex',flexWrap:'wrap',alignItems:'center',gap:'10px'}},
      h('div',{style:{flex:'1',minWidth:'160px'}},
        h('div',{style:{fontWeight:'700',color:'#0f2040'}},(stt==='geciken'?'🔴 ':'')+(m.jobName||'(başlıksız)')),
        cust?h('div',{style:{fontSize:'12px',color:T3}},'👤 '+(cust.firmName||'')):h('span'),
        h('div',{style:{fontSize:'11px',color:T4}},'Vade: '+(maintNextDue(m)?_toTR(maintNextDue(m)):'-')+' · '+maintPeriodLabel(maintPeriod(m)))
      ),
      h('span',{style:{background:c+'18',color:c,border:'1px solid '+c+'55',borderRadius:'20px',padding:'4px 10px',fontSize:'12px',fontWeight:'700'}},dl<0?Math.abs(dl)+' gün gecikti':dl+' gün kaldı'),
      btn('✅ Tamamla',()=>maintDone(m),'linear-gradient(135deg,#16a34a,#15803d)','#fff','7px 12px',{fontSize:'12px'}),
      btn('Düzenle',()=>setState({modal:{type:'maintenance',item:m}}),'#eff6ff','#1d4ed8','7px 12px',{fontSize:'12px',border:'1px solid #bfdbfe'})
    );
  };
```

- [ ] **Step 3: renderMaintenances — Yaklaşan/Geciken sekmelerinde erken dönüş ekle**

`APRO_CRM_Firebase.html:5764` mevcut satır (ana return başlangıcı):

```javascript
  return h('div',{style:{animation:'fu .3s ease'}},
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}},
      h('h2',{style:{fontSize:isMobM?'16px':'20px',fontWeight:'800',color:'#0f1f35'}},'⚙️ Periyodik Bakım ',h('span',{style:{fontSize:'12px',color:T3,fontWeight:'400'}},'('+maintFiltered.length+'/'+state.maintenances.length+')')),
      btn(isMobM?'+ Bakım':'+ Yeni Periyodik Bakım Takip',()=>setState({modal:{type:'maintenance',item:null}}),'linear-gradient(135deg,#16a34a,#15803d)','#fff',isMobM?'9px 14px':'10px 20px',{fontSize:'14px',borderRadius:'10px',boxShadow:'0 3px 8px rgba(22,163,74,.3)'})
    ),
    maintFilterBox,
```

Bu return ifadesinin **hemen üstüne** (satır 5764'ten önce) sekme erken dönüşlerini ekle:

```javascript
  const maintHeaderRow=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}},
    h('h2',{style:{fontSize:isMobM?'16px':'20px',fontWeight:'800',color:'#0f1f35'}},'⚙️ Periyodik Bakım ',h('span',{style:{fontSize:'12px',color:T3,fontWeight:'400'}},'('+maintFiltered.length+'/'+state.maintenances.length+')')),
    btn(isMobM?'+ Bakım':'+ Yeni Periyodik Bakım Takip',()=>setState({modal:{type:'maintenance',item:null}}),'linear-gradient(135deg,#16a34a,#15803d)','#fff',isMobM?'9px 14px':'10px 20px',{fontSize:'14px',borderRadius:'10px',boxShadow:'0 3px 8px rgba(22,163,74,.3)'})
  );
  if(mTab==='yaklasan'){
    return h('div',{style:{animation:'fu .3s ease'}}, maintHeaderRow, maintTabBar, maintInfoNote,
      upcomingM.length ? h('div',{}, ...upcomingM.sort((a,b)=>maintDaysLeft(a)-maintDaysLeft(b)).map(maintDueRow))
        : h('div',{style:{padding:'24px',textAlign:'center',color:T4,background:'#fff',borderRadius:'12px',border:'1px solid #d0daea'}},'15 gün içinde vadesi gelen bakım yok.'));
  }
  if(mTab==='geciken'){
    return h('div',{style:{animation:'fu .3s ease'}}, maintHeaderRow, maintTabBar, maintInfoNote,
      overdueM.length ? h('div',{}, ...overdueM.sort((a,b)=>maintDaysLeft(a)-maintDaysLeft(b)).map(maintDueRow))
        : h('div',{style:{padding:'24px',textAlign:'center',color:T4,background:'#fff',borderRadius:'12px',border:'1px solid #d0daea'}},'Vadesi geçmiş bakım yok. 👍'));
  }
```

- [ ] **Step 4: renderMaintenances — "Tümü" return'üne sekme çubuğunu yerleştir**

`APRO_CRM_Firebase.html` içinde Step 3 sonrası kalan ana return'de, `maintFilterBox,` satırının **hemen üstüne** `maintTabBar,` ve `maintInfoNote,` ekle. Mevcut:

```javascript
    ),
    maintFilterBox,
    isMobM ?
```

Şununla değiştir:

```javascript
    ),
    maintTabBar,
    maintInfoNote,
    maintFilterBox,
    isMobM ?
```

- [ ] **Step 5: Run syntax check**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Manual verification (browser)**

Periyodik Bakım ekranı → üç sekme (Tümü/Yaklaşan/Geciken) görünür ve sayılar doğru. Periyot atanmış + vadesi ≤15 gün kayıt "Yaklaşan"da; vadesi geçmiş "Geciken"de kırmızı. "Tamamla" tıkla → not sor → yeni vade ileri sarılır, kayıt sekmeden düşer.

- [ ] **Step 7: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat: Faz 3b renderMaintenances — Yaklaşan/Geciken sekmeleri + vade rozeti"
```

---

## Task 8: `buildBakimModal` — bakım geçmişi modalı + dispatch

**Files:**
- Modify: `APRO_CRM_Firebase.html` (FAZ 3b bloğu içine — buildBakimModal)
- Modify: `APRO_CRM_Firebase.html:7893` (modal dispatch)

- [ ] **Step 1: Write the implementation — geçmiş modalı**

`APRO_CRM_Firebase.html` içinde `async function maintDone(m){ ... }` fonksiyonunun kapanışının **hemen altına** (yani `maintDone` ile `// ================= /FAZ 3b =================` arasına) ekle:

```javascript
// Bakım geçmişi modalı (tamamlanan bakımlar).
function buildBakimModal(maintId){
  const m=(state.maintenances||[]).find(x=>x.id===maintId);
  if(!m) return modal('Bakım Geçmişi', h('div',{style:{padding:'20px',color:'#64748b'}},'Kayıt bulunamadı.'), ()=>setState({modal:null}), '520px');
  const cust=(state.customers||[]).find(c=>c.id===m.customerId)||null;
  const hist=[...maintHistory(m)].reverse();
  const rows = hist.length ? hist.map(hx=>h('div',{style:{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'9px',padding:'10px 12px',marginBottom:'7px'}},
      h('div',{style:{fontSize:'12px',fontWeight:'700',color:'#0f2040'}},'✅ '+(hx.at?_toTR(hx.at):'-')+(hx.by?' · '+hx.by:'')),
      hx.note?h('div',{style:{fontSize:'12px',color:'#475569',marginTop:'3px'}},hx.note):h('span')
    )) : [h('div',{style:{padding:'16px',textAlign:'center',color:'#94a3b8'}},'Henüz tamamlanmış bakım yok.')];
  const content=h('div',{},
    h('div',{style:{marginBottom:'12px'}},
      h('div',{style:{fontWeight:'800',fontSize:'15px',color:'#0f1f35'}},m.jobName||'(başlıksız)'),
      cust?h('div',{style:{fontSize:'12px',color:'#475569'}},'👤 '+(cust.firmName||'')):h('span'),
      h('div',{style:{fontSize:'12px',color:'#475569',marginTop:'4px'}},'🔁 '+maintPeriodLabel(maintPeriod(m))+' · Sonraki vade: '+(maintNextDue(m)?_toTR(maintNextDue(m)):'-'))
    ),
    h('div',{style:{fontSize:'12px',fontWeight:'700',color:'#334155',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'8px'}},'Geçmiş ('+hist.length+')'),
    ...rows,
    h('div',{style:{marginTop:'12px'}}, btn('Kapat',()=>setState({modal:null}),'#21262d','#8b949e','10px 18px',{fontSize:'14px'}))
  );
  return modal('🕘 Bakım Geçmişi', content, ()=>setState({modal:null}), '520px');
}
```

- [ ] **Step 2: Write the implementation — modal dispatch**

`APRO_CRM_Firebase.html:7893` mevcut satır:

```javascript
    else if(type==='ariza') m=buildArizaModal(state.modal.serviceId);
```

Bu satırın **hemen altına** ekle:

```javascript
    else if(type==='bakim') m=buildBakimModal(state.modal.maintId);
```

- [ ] **Step 3: Run syntax check**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 4: Manual verification (browser)**

Takipteki bir bakımı Tamamla (1+ kez) → düzenle-aç → "🕘 Geçmiş (n)" butonu → modal açılır, tamamlama kayıtları (tarih/kişi/not) + sonraki vade listelenir.

- [ ] **Step 5: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat: Faz 3b buildBakimModal — bakım geçmişi modalı + dispatch"
```

---

## Task 9: Ölü hatırlatma altyapısını `mtNextDue`'ya bağla (bildirim + e-posta)

**Files:**
- Modify: `APRO_CRM_Firebase.html:8247-8261` (bildirim bloğu)
- Modify: `APRO_CRM_Firebase.html:8599-8615` (e-posta bloğu)

Not (spec §5): bu bloklar bugün `m.appointmentDate` okuyor — bu alan hiç kaydedilmediği için ölü. `mtNextDue`'ya bağlanır. Oto-görev üreticisi (satır ~6705) **dokunulmaz** (spec madde 2 / öneri b).

- [ ] **Step 1: Bildirim bloğunu rewire et**

`APRO_CRM_Firebase.html:8247-8261` mevcut blok:

```javascript
  (state.maintenances||[]).forEach(m=>{
    if(!m.appointmentDate) return;
    const cn=_custName(m.customerId);
    const iso=_toISO(m.appointmentDate);
    const diff=_diffDays(iso);
    // 7 gün - 09:00
    if(diff===7 && now>=540 && now<=544) {
      showNotification('maint_7d_'+m.id,'⚙️ Bakım 7 Gün Sonra',(m.jobName||'Bakım')+' · '+cn+' · '+m.appointmentDate,'warning',m.preparedBy);
    }
    // Geçti - her gün 09:00
    if(diff<0 && now>=540 && now<=544) {
      showNotification('maint_over_'+m.id+'_'+today,'🚨 Bakım Tarihi Geçti!',(m.jobName||'Bakım')+' · '+cn+' · '+Math.abs(diff)+' gün geçti','urgent',m.preparedBy);
      showNotification('maint_over_adm_'+m.id+'_'+today,'🚨 Bakım Tarihi Geçti',(m.jobName||'Bakım')+' · '+cn,'urgent','admin');
    }
  });
```

Şununla değiştir (kaynak = `mtNextDue`; hedef kullanıcı = `serviceContact` fallback `preparedBy`):

```javascript
  (state.maintenances||[]).forEach(m=>{
    const due=maintNextDue(m);
    if(!due) return;
    const cn=_custName(m.customerId);
    const iso=_toISO(due);
    const diff=_diffDays(iso);
    const tgt=m.serviceContact||m.preparedBy;
    // 7 gün - 09:00
    if(diff===7 && now>=540 && now<=544) {
      showNotification('maint_7d_'+m.id,'⚙️ Bakım 7 Gün Sonra',(m.jobName||'Bakım')+' · '+cn+' · '+_toTR(due),'warning',tgt);
    }
    // Geçti - her gün 09:00
    if(diff<0 && now>=540 && now<=544) {
      showNotification('maint_over_'+m.id+'_'+today,'🚨 Bakım Vadesi Geçti!',(m.jobName||'Bakım')+' · '+cn+' · '+Math.abs(diff)+' gün geçti','urgent',tgt);
      showNotification('maint_over_adm_'+m.id+'_'+today,'🚨 Bakım Vadesi Geçti',(m.jobName||'Bakım')+' · '+cn,'urgent','admin');
    }
  });
```

- [ ] **Step 2: E-posta bloğunu rewire et**

`APRO_CRM_Firebase.html:8599-8615` mevcut blok:

```javascript
  (state.maintenances||[]).forEach(m => {
    if(!m.appointmentDate) return;
    const diff = _diffDays(_toISO(m.appointmentDate));
    if(diff === 7 && now >= 540 && now <= 544) {
      const cn = _custName(m.customerId);
      const mailKey = 'mail_maint_7d_' + m.id;
      const subject = '⚙️ Bakım 7 Gün Sonra: ' + (m.jobName||'Bakım');
      const body = mailBody('⚙️', 'Periyodik Bakım 7 Gün Sonra', [
        ['İşin Adı', m.jobName || '-'],
        ['Firma', cn],
        ['Bakım Tarihi', _toTR(m.appointmentDate)],
        ['İlgili', m.preparedBy || '-'],
      ]);
      const repEmail = getUserEmail(m.preparedBy);
      if(repEmail) sendMail(mailKey, repEmail, subject, body);
    }
  });
```

Şununla değiştir:

```javascript
  (state.maintenances||[]).forEach(m => {
    const due = maintNextDue(m);
    if(!due) return;
    const diff = _diffDays(_toISO(due));
    if(diff === 7 && now >= 540 && now <= 544) {
      const cn = _custName(m.customerId);
      const tgt = m.serviceContact || m.preparedBy;
      const mailKey = 'mail_maint_7d_' + m.id;
      const subject = '⚙️ Bakım 7 Gün Sonra: ' + (m.jobName||'Bakım');
      const body = mailBody('⚙️', 'Periyodik Bakım 7 Gün Sonra', [
        ['İşin Adı', m.jobName || '-'],
        ['Firma', cn],
        ['Bakım Vadesi', _toTR(due)],
        ['İlgili', tgt || '-'],
      ]);
      const repEmail = getUserEmail(tgt);
      if(repEmail) sendMail(mailKey, repEmail, subject, body);
    }
  });
```

- [ ] **Step 3: Run syntax check**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 4: Full regression — pure-function tests**

Run: `node docs/superpowers/tests/faz3b-addmonth.test.js && node docs/superpowers/tests/faz3b-nextdue.test.js && node docs/superpowers/tests/faz3b-duestatus.test.js`
Expected: her biri `✅ all passed`

- [ ] **Step 5: Manual verification (browser)**

Bir bakıma `mtNextDue` = bugünden +7 gün ata; saat 09:00–09:04 penceresinde (veya geçici olarak koşulu gevşeterek test) bildirimin `mtNextDue` üzerinden tetiklendiğini doğrula. Vadesi geçmiş kayıtta "Vadesi Geçti" bildirimi.

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "fix: Faz 3b ölü bakım hatırlatmalarını mtNextDue'ya bağla (bildirim+mail)"
```

---

## Self-Review

**1. Spec coverage:**
- §3 Veri modeli (`mtPeriod/mtPeriodDays/mtNextDue/mtLastDone/mtHistory`) → Task 2 (accessors + defaults) + Task 6 (modal defaults). ✓
- §4 Mükerrerlik ayrımı (appointment vs mtNextDue coexist) → Task 6 randevu kutusu korunur, ayrı periyot kutusu; not metni. ✓
- §5 Ölü kod tamiri (bildirim+mail → mtNextDue; oto-görev dokunulmaz) → Task 9. ✓
- §6 `_addMonth` + `computeNextDue` → Task 2 + Task 3. ✓
- §7 erişimciler + `maintDueStatus/maintDaysLeft/maintIsTracked` → Task 2 + Task 4. ✓
- §8 `maintDone` (history + reset status + saveMaint yolu) → Task 5. ✓
- §9 UI: tablar + modal + `buildBakimModal` → Task 6/7/8. ✓
- §10 yetkiler: herkes → özel gate yok, doğru. ✓
- §11 doğrulama: syntax + manuel → her task'ta. ✓
- ORTAK → filterFY yok: renderMaintenances zaten `state.maintenances` kullanıyor (filterFY yok), korunuyor. ✓
- Cascade delete yok: maintDone görev üretmiyor → gereksiz, doğru. ✓

**2. Placeholder scan:** Tüm adımlar tam kod içeriyor; "TBD/TODO/handle edge cases" yok. ✓

**3. Type consistency:**
- `mtPeriod/mtPeriodDays/mtNextDue/mtLastDone/mtHistory` alan adları tüm task'larda tutarlı. ✓
- `maintNextDue/maintPeriod/maintPeriodDays/maintHistory/maintIsTracked/maintDueStatus/maintDaysLeft/maintPeriodLabel/computeNextDue/maintDone/_addMonth/_addDay/_ymd/MAINT_PERIODS` isimleri Task 2→9 boyunca aynı. ✓
- `computeNextDue(baseISO, period, days)` imzası Task 3'te tanımlı; Task 5 `maintDone` ve Task 3 testleri aynı sırayla çağırıyor. ✓
- Modal dispatch `type==='bakim'` + `state.modal.maintId` (Task 6 buton + Task 8 dispatch + buildBakimModal parametresi) tutarlı. ✓
- `PMOD.maintTab` (Task 1... hayır Task 7 Step1 default + Step2 okuma) tutarlı. ✓

Gap yok; plan spec'i tam kapsıyor.

---

## Execution Handoff

Plan kaydedildi: `docs/superpowers/plans/2026-07-30-faz3b-periyodik-bakim.md`.
