# Periyodik Bakım Otomasyonu v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sabit takvim üzerinden kaçıncı-bakım bazlı geri dönük giriş, plandan-sapma görünürlüğü, tek-kayan-görev senkronu (otomatik devir + bildirim) ve geciken bakım için 2 günde bir mail ekleyerek periyodik bakım modülünü tamamlar.

**Architecture:** Tüm CRM değişiklikleri tek dosyalık `APRO_CRM_Firebase.html`'de (vanilla JS, `h()` virtual DOM, Firebase Firestore) mevcut `mtSystems`/`tasks` altyapısına oturtulur; yeni sistem kurulmaz. Sunucu tarafı geciken-mail eklentisi `nextaura-admin/src/lib/crm-reminders.ts`'e, mevcut 7-gün-önce bloğunun yanına eklenir.

**Tech Stack:** Vanilla JS (tarayıcı, framework yok) + Firebase Firestore (CRM); Next.js/TypeScript + Vercel Cron (nextaura-admin).

**Spec:** `docs/superpowers/specs/2026-08-29-periyodik-bakim-otomasyon-v2-design.md`

---

## Bu Kod Tabanı İçin Test Yaklaşımı (okuyup geç)

Bu projede test çerçevesi (Jest/Vitest/vb.) yoktur. Kurulu doğrulama yöntemi (`CLAUDE.md`): (1) `node vm.Script` ile **parse-only** syntax kontrolü — script hiçbir zaman çalıştırılmaz (DOM/Firebase referansları çalışma anında patlar), (2) mantık doğrulaması. Bu plan buna uyarlanmıştır:

- **Saf fonksiyonlar** (DOM/Firebase'e dokunmayan: `mtGenerateSchedule`, `mtAdvanceSystem`, `mtCompleteVisit`) için: fonksiyonun **aynı** kodu bağımsız bir `node -e` betiğine kopyalanır, gerçek `console.assert` iddialarıyla çalıştırılır — bu, dosyaya yapıştırılacak kodun doğruluğunu dosyaya dokunmadan kanıtlar.
- **DOM/Firebase'e bağımlı fonksiyonlar** (`maintSysSection`, `persistMaint`, `maintSyncTask`, `delItem`) için: her değişiklikten sonra zorunlu syntax kontrolü + plan içinde somut örnek senaryo üzerinden elle iz sürme (satır satır hangi değerin ne olacağı yazılı).
- Uygulama Firebase kimlik doğrulaması gerektirdiğinden headless tarayıcı testi bu ortamda mümkün değil (denendi, engellendi) — canlıya alındıktan sonra tarayıcıda elle kabul testi yapılmalıdır (Task 8'de listelenir).

---

### Task 1: Sabit takvime çapalı ilerleme — `mtAdvanceSystem` / `mtCompleteVisit`

**Files:**
- Modify: `APRO_CRM_Firebase.html:7244-7245`
- Modify: `APRO_CRM_Firebase.html` (`maintVisitDone` içindeki `mtCompleteVisit(...)` çağrısı, `async function maintVisitDone(m){` bloğu içinde)
- Test: `/private/tmp/claude-501/-Users-erkankaracakale/ff02a765-e93b-4881-9a67-5db7fd5f3aa2/scratchpad/test-mtadvance.js` (geçici, commit edilmez)

- [ ] **Step 1: Bağımsız doğrulama betiğini yaz**

`/private/tmp/claude-501/-Users-erkankaracakale/ff02a765-e93b-4881-9a67-5db7fd5f3aa2/scratchpad/test-mtadvance.js`:

```js
function _ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function _toISO(d){ if(!d) return null; d=d.trim(); if(/^\d{4}-\d{2}-\d{2}/.test(d)) return d.substring(0,10); var p=d.split('.'); if(p.length===3) return p[2]+'-'+p[1].padStart(2,'0')+'-'+p[0].padStart(2,'0'); return d; }
function _toDate(d){ var iso=_toISO(d); if(!iso) return null; var p=iso.split('-'); if(p.length!==3) return null; return new Date(parseInt(p[0]),parseInt(p[1])-1,parseInt(p[2])); }
function _addMonth(iso, n){ var dt=_toDate(iso); if(!dt) return ''; var d0=dt.getDate(); dt.setDate(1); dt.setMonth(dt.getMonth()+Number(n)); var last=new Date(dt.getFullYear(), dt.getMonth()+1, 0).getDate(); dt.setDate(Math.min(d0,last)); return _ymd(dt); }
function mtFreqMonths(freq){ return ({aylik:1,'3aylik':3,'6aylik':6,yillik:12})[freq] || 0; }
function mtGenerateSchedule(baseISO, endISO, freq){ var m=mtFreqMonths(freq); if(!baseISO||!endISO||!m) return []; var out=[]; var cur=_addMonth(baseISO,m); var guard=0; while(cur && cur<=endISO && guard<60){ out.push(cur); cur=_addMonth(cur,m); guard++; } return out; }

// ↓↓↓ Task 1, Step 3'te dosyaya yapıştırılacak KOD İLE BİREBİR AYNI ↓↓↓
function mtAdvanceSystem(sys, base, end){
  var mo = mtFreqMonths(sys.freq);
  if(!mo || !sys.due) return sys;
  var schedule = mtGenerateSchedule(base, end, sys.freq);
  if(schedule.length){
    var doneCount = (sys.doneCount||0) + 1;
    return Object.assign({}, sys, {doneCount:doneCount, due:schedule[doneCount]||'', lastDone:sys.due});
  }
  return Object.assign({}, sys, {due:_addMonth(sys.due, mo), lastDone:sys.due});
}
function mtCompleteVisit(systems, visitISO, base, end){
  return (systems||[]).map(function(s){ return (s.due && visitISO && s.due <= visitISO) ? mtAdvanceSystem(s, base, end) : s; });
}
// ↑↑↑ ↑↑↑

var base='2026-01-01', end='2027-01-01';
var schedule = mtGenerateSchedule(base, end, '3aylik');
console.assert(JSON.stringify(schedule)===JSON.stringify(['2026-04-01','2026-07-01','2026-10-01']), 'FAIL schedule: '+JSON.stringify(schedule));

var sys = {sysKey:'sprinkler', freq:'3aylik', due:'2026-04-01', doneCount:0};
var advanced = mtAdvanceSystem(sys, base, end);
console.assert(advanced.doneCount===1, 'FAIL doneCount, got '+advanced.doneCount);
console.assert(advanced.due==='2026-07-01', 'FAIL due, got '+advanced.due);
console.assert(advanced.lastDone==='2026-04-01', 'FAIL lastDone, got '+advanced.lastDone);

// Müşteri 1. ziyareti 2026-04-06'ya kaydırdı — bu, 2. ziyaretin PLANINI etkilememeli.
var sysNegotiated = {sysKey:'sprinkler', freq:'3aylik', due:'2026-04-06', doneCount:0};
var advanced2 = mtAdvanceSystem(sysNegotiated, base, end);
console.assert(advanced2.due==='2026-07-01', 'FAIL drift leaked into next due: '+advanced2.due);

// Bitiş tarihi girilmemiş (açık uçlu sözleşme) → eski kayan davranış korunmalı.
var sysLegacy = {sysKey:'sprinkler', freq:'3aylik', due:'2026-04-01'};
var advancedLegacy = mtAdvanceSystem(sysLegacy, base, '');
console.assert(advancedLegacy.due==='2026-07-01', 'FAIL legacy fallback due: '+advancedLegacy.due);
console.assert(advancedLegacy.doneCount===undefined, 'FAIL legacy fallback should not set doneCount');

// Sözleşme sonu — 4. (son) ziyaret tamamlanınca sıradaki vade boş dönmeli.
var sysLast = {sysKey:'sprinkler', freq:'3aylik', due:'2026-10-01', doneCount:2};
var advancedLast = mtAdvanceSystem(sysLast, base, end);
console.assert(advancedLast.due==='', 'FAIL end-of-contract due should be empty, got '+advancedLast.due);
console.assert(advancedLast.doneCount===3, 'FAIL end-of-contract doneCount, got '+advancedLast.doneCount);

console.log('✅ ALL ASSERTIONS PASSED');
```

- [ ] **Step 2: Betiği çalıştır, tüm iddiaların geçtiğini doğrula**

Run: `node /private/tmp/claude-501/-Users-erkankaracakale/ff02a765-e93b-4881-9a67-5db7fd5f3aa2/scratchpad/test-mtadvance.js`
Expected: `✅ ALL ASSERTIONS PASSED` (hiçbir `Assertion failed` satırı olmamalı).

- [ ] **Step 3: Aynı kodu dosyaya yapıştır**

`APRO_CRM_Firebase.html:7244-7245` şu an:
```js
function mtAdvanceSystem(sys){ var m = mtFreqMonths(sys.freq); if(!m || !sys.due) return sys; return Object.assign({}, sys, {due:_addMonth(sys.due, m), lastDone:sys.due}); }
function mtCompleteVisit(systems, visitISO){ return (systems||[]).map(function(s){ return (s.due && visitISO && s.due <= visitISO) ? mtAdvanceSystem(s) : s; }); }
```
Bunu şununla değiştir:
```js
function mtAdvanceSystem(sys, base, end){
  var mo = mtFreqMonths(sys.freq);
  if(!mo || !sys.due) return sys;
  var schedule = mtGenerateSchedule(base, end, sys.freq);
  if(schedule.length){
    var doneCount = (sys.doneCount||0) + 1;
    return Object.assign({}, sys, {doneCount:doneCount, due:schedule[doneCount]||'', lastDone:sys.due});
  }
  return Object.assign({}, sys, {due:_addMonth(sys.due, mo), lastDone:sys.due});
}
function mtCompleteVisit(systems, visitISO, base, end){
  return (systems||[]).map(function(s){ return (s.due && visitISO && s.due <= visitISO) ? mtAdvanceSystem(s, base, end) : s; });
}
```

- [ ] **Step 4: `maintVisitDone` içindeki çağrıyı base/end geçirecek şekilde güncelle**

Bul: `const advanced = mtCompleteVisit(m.mtSystems, recordDue);`
Değiştir: `const advanced = mtCompleteVisit(m.mtSystems, recordDue, m.mtBaseDate, m.mtEndDate);`

- [ ] **Step 5: JS syntax kontrolü**

Run:
```bash
node -e "
const fs=require('fs');
const html=fs.readFileSync('APRO_CRM_Firebase.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const main=scripts.filter(s=>s[1].length>1000).pop();
const vm=require('vm');
try{new vm.Script(main[1]);console.log('✅ SYNTAX OK');}
catch(e){console.log('❌',e.message);}
"
```
Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Bakım vadesini sabit takvime çapala (doneCount)

mtAdvanceSystem artık bitiş tarihi girilmiş sistemlerde bir sonraki
vadeyi sys.due'dan değil sabit programdan (schedule[doneCount]) alır.
Böylece müşteri talebiyle bir ziyaretin tarihi kaysa bile sonraki
ziyaretlerin planı bozulmaz. Bitiş tarihi girilmemiş kayıtlarda eski
kayan davranış (due + periyot) korunur.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: `maintSysSection` — doneCount sıfırlama, numaralı liste, plandan-sapma rozeti

**Files:**
- Modify: `APRO_CRM_Firebase.html:1930-1975` (`function maintSysSection(f){...}`)

- [ ] **Step 1: Fonksiyonun tamamını yeni sürümle değiştir**

Mevcut `function maintSysSection(f){` ile başlayıp o fonksiyonun kapanış `}`'ine kadar olan bloğu (satır 1930-1975) bununla değiştir:

```js
function maintSysSection(f){
  if(!Array.isArray(f.mtSystems)) f.mtSystems=[];
  const base = f.mtBaseDate || f.appointmentStart || f.createdAt || today();
  f.mtBaseDate = base;
  const endDate = f.mtEndDate || f.appointmentEnd || '';
  f.mtEndDate = endDate;
  const rerender = ()=>setState({modal:{type:'maintenance',item:JSON.parse(JSON.stringify(f))}});
  const sysOpts = [{v:'',l:'-- Sistem --'}, ...Object.keys(SYS_META).map(k=>({v:k,l:SYS_META[k].l}))];
  const fBase = inp('', base, v=>{
    f.mtBaseDate=v;
    f.mtSystems = f.mtSystems.map(s=> s.freq ? Object.assign({}, s, {due: mtSysFirstDue(v, s.freq), lastDone:'', doneCount:0}) : s);
    rerender();
  }, 'date');
  const fEndDate = inp('', endDate, v=>{ f.mtEndDate=v; rerender(); }, 'date');
  const rows = f.mtSystems.map((s,i)=>{
    const selSys = sel(sysOpts, s.sysKey||'', v=>{ f.mtSystems[i].sysKey=v; rerender(); });
    const selFreq = sel(MT_FREQ_OPTS, s.freq||'', v=>{ f.mtSystems[i].freq=v; f.mtSystems[i].due=mtSysFirstDue(f.mtBaseDate, v); f.mtSystems[i].lastDone=''; f.mtSystems[i].doneCount=0; rerender(); });
    const dueInp = inp('', s.due||'', v=>{ f.mtSystems[i].due=v; rerender(); }, 'date', {padding:'6px 8px',fontSize:'12px',fontWeight:'700',color:'#15803d',border:'1.5px solid #bbf7d0',background:'#fff'});
    const schedule = mtGenerateSchedule(f.mtBaseDate, f.mtEndDate, s.freq);
    const doneCount = s.doneCount||0;
    const plannedNow = schedule[doneCount] || '';
    let driftBadge = h('span');
    if(plannedNow && s.due && s.due!==plannedNow){
      const dd = Math.round((_toDate(s.due) - _toDate(plannedNow))/86400000);
      if(Math.abs(dd)>3){
        driftBadge = h('span',{style:{fontSize:'10px',color:'#b45309',background:'#fef3c7',padding:'2px 6px',borderRadius:'8px',marginLeft:'6px',fontWeight:'700',whiteSpace:'nowrap'}}, '⚠️ Plandan '+Math.abs(dd)+' gün kaydı');
      }
    }
    const scheduleItems = schedule.map((d,idx)=> idx>=doneCount ? h('span',{style:{marginRight:'10px',fontWeight:idx===doneCount?'800':'500',color:idx===doneCount?'#0f5132':'#166534'}}, (idx+1)+'. Bakım: '+_toTR(d)) : null).filter(Boolean);
    const scheduleBlock = !schedule.length ? h('span')
      : (doneCount>=schedule.length ? h('div',{style:{fontSize:'11px',color:'#0f5132',marginTop:'3px',fontWeight:'700'}},'✅ Sözleşme kapsamındaki tüm bakımlar tamamlandı')
         : h('div',{style:{fontSize:'11px',color:'#166534',marginTop:'3px',paddingLeft:'2px'}}, ...scheduleItems));
    return h('div',{style:{marginBottom:'8px'}},
      h('div',{style:{display:'flex',gap:'6px',alignItems:'center'}},
        h('div',{style:{flex:'2'}}, selSys),
        h('div',{style:{flex:'1.3'}}, selFreq),
        h('div',{style:{flex:'1.2',display:'flex',alignItems:'center'}}, dueInp, driftBadge),
        btn('✕',()=>{ f.mtSystems.splice(i,1); rerender(); },'#fee2e2','#b91c1c','6px 10px',{fontSize:'12px'})
      ),
      scheduleBlock
    );
  });
  const recordDue = mtRecordNextDue(f.mtSystems);
  const dueList = mtSystemsDueOn(f.mtSystems, recordDue);
  f.mtNextDue = recordDue;
  return h('div',{style:{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'10px',padding:'14px',marginBottom:'11px'}},
    lbl('🔁 Periyodik Bakım Takibi (Çok Sistemli)'),
    row(field('Sözleşme / Baz Tarihi', fBase, true), field('Bitiş Tarihi', fEndDate, true)),
    h('div',{style:{fontSize:'11px',color:'#15803d',marginBottom:'8px'}},'ℹ️ Her sistem kendi periyodunda takip edilir. Kayıt vadesi = en erken sistem vadesi. Bitiş tarihi girilirse tüm planlanan ziyaret tarihleri (kaç kez yapılacağı dahil) otomatik hesaplanır. Vade tarihini devam eden işler için elle de değiştirebilirsiniz.'),
    rows.length ? h('div',{}, ...rows) : h('div',{style:{fontSize:'12px',color:'#64748b',marginBottom:'6px'}},'Henüz sistem eklenmedi.'),
    btn('+ Sistem Ekle',()=>{ f.mtSystems.push({sysKey:'',freq:'',due:'',lastDone:'',doneCount:0}); rerender(); },'#dcfce7','#15803d','8px 12px',{fontSize:'12px',marginBottom:'8px'}),
    recordDue ? h('div',{style:{marginTop:'8px',paddingTop:'8px',borderTop:'1px dashed #bbf7d0'}},
      h('div',{style:{fontSize:'13px',fontWeight:'800',color:'#0f5132'}},'📅 Sonraki Bakım Vadesi: '+_toTR(recordDue)),
      dueList.length ? h('div',{style:{fontSize:'12px',color:'#15803d',marginTop:'3px'}},'Bu ziyarette: '+dueList.map(s=>SYS_META[s.sysKey]?SYS_META[s.sysKey].l:s.sysKey).join(', ')) : h('span')
    ) : h('span')
  );
}
```

- [ ] **Step 2: JS syntax kontrolü** — Task 1 Step 5'teki komutu tekrar çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Elle iz sürme (kod okuyarak doğrula)**

Senaryo: `mtBaseDate='2026-01-01'`, `mtEndDate='2027-01-01'`, sistem `freq='3aylik'`, `doneCount=1`, `due='2026-07-06'` (müşteri 6 gün kaydırmış).
- `schedule` = `['2026-04-01','2026-07-01','2026-10-01']`
- `plannedNow` = `schedule[1]` = `'2026-07-01'`
- `dd` = `(2026-07-06 − 2026-07-01)` gün = `5` → `Math.abs(5)>3` → rozet basılır: **"⚠️ Plandan 5 gün kaydı"**
- `scheduleItems`: `idx=0` (`doneCount=1`'den küçük) atlanır; `idx=1` → **"2. Bakım: 01.07.2026"** (kalın, sıradaki); `idx=2` → **"3. Bakım: 01.10.2026"**. 1. bakım listede görünmez, numaralar kaymaz.

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Bakım UI: numaralı planlanan liste + plandan-sapma rozeti

Planlanan ziyaret listesi artık her tarihi mutlak sıra numarasıyla
gösteriyor (2. Bakım, 3. Bakım...), tamamlananlar listeden düşüyor ama
numaralar kaymıyor. Vade tarihi planlanan tarihten >3 gün sapıyorsa
bilgilendirici (engellemeyen) bir rozet gösteriliyor.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: `persistMaint` + `maintSyncTask` — merkezi kayıt ve görev senkronu

**Files:**
- Modify: `APRO_CRM_Firebase.html` (yeni fonksiyonlar; `maintVisitDone` fonksiyonunun hemen üstüne, satır ~1976 civarına eklenecek)

- [ ] **Step 1: `maintSyncTask` ve `persistMaint` fonksiyonlarını ekle**

`async function maintVisitDone(m){` satırının hemen üzerine ekle:

```js
// Bir bakım kaydına bağlı tek "kayan" görevi (varsa) senkronlar: oluştur/güncelle,
// vade değiştiyse yeniden aç, ilgili kişi değiştiyse otomatik devret + bildir.
function maintTaskId(m){ return 'auto_maint_'+m.id; }
async function maintSyncTask(m){
  try{
    const existing = (state.tasks||[]).map(normTask).find(t=>t.id===maintTaskId(m));
    if(!m.mtNextDue){
      if(existing && !taskIsClosed(existing)){
        await personelSaveDoc('tasks', Object.assign({}, existing, {status:'tamamlandi', completedAt:today()}));
      }
      return;
    }
    const person = personelPeople().find(u=>u.displayName===m.serviceContact);
    const dept = person ? person.department : '';
    const cust = (state.customers||[]).find(c=>c.id===m.customerId);
    const title = '🔁 Periyodik Bakım: '+((cust&&cust.firmName)||'Müşteri')+' — '+(m.jobName||'Bakım');
    if(!existing){
      if(!m.serviceContact) return;
      const t = normTask({
        id: maintTaskId(m), title, desc:'Planlı periyodik bakımı gerçekleştir ve tamamla.',
        assignedTo:m.serviceContact, department:dept,
        assignedBy:'sistem', context:'bakim', linkType:'maintenance', linkId:m.id, linkLabel:m.jobName||'',
        dueDate:m.mtNextDue, dueTime:'', startDate:'', status:'yapilacak', completedAt:null, priority:'orta',
        needsApproval:false, revisionCount:0, assignmentHistory:[], comments:[],
        autoGenerated:true, createdBy:'sistem', createdAt:today(), fiscalYear:activeFiscalYear()
      });
      await personelSaveDoc('tasks', t);
      return;
    }
    let next = Object.assign({}, existing, {title, department:dept});
    const dueChanged = existing.dueDate !== m.mtNextDue;
    if(dueChanged){ next.dueDate = m.mtNextDue; next.status = 'yapilacak'; next.completedAt = null; }
    if(m.serviceContact && existing.assignedTo !== m.serviceContact){
      const hist = (existing.assignmentHistory||[]).concat([{from:existing.assignedTo, to:m.serviceContact, at:today(), by:'sistem', reason:'sistem', note:'İlgili kişi bakım kaydında değiştirildi.'}]);
      next.assignedTo = m.serviceContact;
      next.assignmentHistory = hist;
      await personelSaveDoc('tasks', next);
      showNotification('task_reassign_'+next.id, '↪ Yeni görev', (next.title||'Görev')+' size devredildi.', 'info', m.serviceContact);
      return;
    }
    if(dueChanged || next.title!==existing.title || next.department!==existing.department){
      await personelSaveDoc('tasks', next);
    }
  }catch(e){ /* sessiz — görev senkronu ana CRM akışını etkilemez (personelAutoGenerateTasks deseniyle tutarlı) */ }
}
// maintenances koleksiyonuna yazan TÜM yollar bunu kullanır — saveDoc + state + görev senkronu tek yerde.
async function persistMaint(data){
  await saveDoc('maintenances', data.id, data);
  const exists = state.maintenances.some(x=>x.id===data.id);
  const list = exists ? state.maintenances.map(x=> x.id===data.id ? data : x) : [...state.maintenances, data];
  setState({maintenances:list});
  await maintSyncTask(data);
  return data;
}
```

- [ ] **Step 2: JS syntax kontrolü** — Task 1 Step 5'teki komutu çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Elle iz sürme**

Senaryo A (yeni görev): `m = {id:'m1', jobName:'Platin Tower', serviceContact:'Ahmet', mtNextDue:'2026-11-28', customerId:'c1'}`, `state.tasks` içinde `auto_maint_m1` yok → `existing=undefined` → `!existing` dalı → `m.serviceContact` dolu → yeni görev oluşturulur: `id:'auto_maint_m1'`, `assignedTo:'Ahmet'`, `dueDate:'2026-11-28'`, `status:'yapilacak'`.

Senaryo B (devir): Aynı kayıt sonradan `serviceContact:'Mehmet'` ile kaydedilirse → `existing` bulunur → `dueChanged=false` (vade aynı) → `m.serviceContact('Mehmet') !== existing.assignedTo('Ahmet')` → `assignmentHistory`'e `{from:'Ahmet',to:'Mehmet',by:'sistem',reason:'sistem'}` eklenir, görev Mehmet'e geçer, Mehmet'e `task_reassign_auto_maint_m1` bildirimi gider.

Senaryo C (sözleşme bitti): `m.mtNextDue=''` → `existing` açıksa `status:'tamamlandi'` yapılıp kapatılır, yeni iş açılmaz.

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Bakım için tek kayan görev senkronu (persistMaint/maintSyncTask)

2026-07-30 Faz 3b spec'indeki 'bakımda görev motoru yok' kararı bu
oturumda tersine çevrilmişti (bkz. 2026-08-29 spec §13). Her bakım
kaydı için deterministik id'li (auto_maint_<id>) tek bir açık görev
tutulur; vade değiştikçe güncellenir, ilgili kişi değişince otomatik
devredilir (assignmentHistory + bildirim ile izli), sözleşme bitince
kapatılır. persistMaint tüm kayıt yollarının ortak geçidi olacak
(sonraki task'ta bağlanacak).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Kayıt yollarını `persistMaint`'e bağla + kaçıncı-bakım bazlı geri dönük giriş

**Files:**
- Modify: `APRO_CRM_Firebase.html:1471-1479` (`saveMaint`)
- Modify: `APRO_CRM_Firebase.html` (`maintVisitDone` — Task 1'de değişen fonksiyonun geri kalanı)
- Modify: `APRO_CRM_Firebase.html:7528-7542` (`maintDone`, legacy tek-periyot)
- Modify: `APRO_CRM_Firebase.html:1998-2015` (`maintAddManualHistory`)

- [ ] **Step 1: `saveMaint`'i `persistMaint` kullanacak şekilde değiştir**

Mevcut:
```js
async function saveMaint(form, isEdit) {
  setState({saving:true});
  const id = isEdit ? form.id : genId();
  const data = {...form, id, ...stamp(), createdAt: form.createdAt||today()};
  await saveDoc('maintenances', id, data);
  const list = isEdit ? state.maintenances.map(m=>m.id===id?data:m) : [...state.maintenances, data];
  setState({maintenances:list, modal:null, saving:false});
  showToast('✅ Periyodik Bakım kaydedildi!');
}
```
Yenisi:
```js
async function saveMaint(form, isEdit) {
  setState({saving:true});
  const id = isEdit ? form.id : genId();
  const data = {...form, id, ...stamp(), createdAt: form.createdAt||today()};
  await persistMaint(data);
  setState({modal:null, saving:false});
  showToast('✅ Periyodik Bakım kaydedildi!');
}
```

- [ ] **Step 2: `maintVisitDone`'daki manuel `saveDoc`/`state` bloğunu `persistMaint`'e çevir**

Mevcut (Task 1 Step 4 sonrası hâli):
```js
  const data = {...m, mtSystems:advanced, mtHistory:hist, mtNextDue:nextDue, mtLastDone:recordDue, status:'Hizmet Henüz Verilmedi', ...stamp()};
  setState({saving:true});
  await saveDoc('maintenances', m.id, data);
  const list = state.maintenances.map(x=> x.id===m.id ? data : x);
  setState({maintenances:list, modal:null, saving:false});
  showToast('✅ Ziyaret tamamlandı — sonraki vade: '+(nextDue?_toTR(nextDue):'-'));
```
Yenisi:
```js
  const data = {...m, mtSystems:advanced, mtHistory:hist, mtNextDue:nextDue, mtLastDone:recordDue, status:'Hizmet Henüz Verilmedi', ...stamp()};
  setState({saving:true});
  await persistMaint(data);
  setState({modal:null, saving:false});
  showToast('✅ Ziyaret tamamlandı — sonraki vade: '+(nextDue?_toTR(nextDue):'-'));
```

- [ ] **Step 3: `maintDone` (legacy) aynı şekilde çevir**

Mevcut:
```js
  const data = {...m, mtLastDone:now, mtHistory:hist, mtNextDue:nextDue, status:'Hizmet Henüz Verilmedi', ...stamp()};
  setState({saving:true});
  await saveDoc('maintenances', m.id, data);
  const list = state.maintenances.map(x => x.id===m.id ? data : x);
  setState({maintenances:list, modal:null, saving:false});
  showToast('✅ Bakım tamamlandı — sonraki vade: ' + (nextDue ? _toTR(nextDue) : '-'));
```
Yenisi:
```js
  const data = {...m, mtLastDone:now, mtHistory:hist, mtNextDue:nextDue, status:'Hizmet Henüz Verilmedi', ...stamp()};
  setState({saving:true});
  await persistMaint(data);
  setState({modal:null, saving:false});
  showToast('✅ Bakım tamamlandı — sonraki vade: ' + (nextDue ? _toTR(nextDue) : '-'));
```

- [ ] **Step 4: `maintAddManualHistory`'yi kaçıncı-bakım bazlı akışla değiştir**

`APRO_CRM_Firebase.html:1998-2015` bloğunun tamamını bununla değiştir:

```js
async function maintAddManualHistory(m, f){
  const systems = (f&&f.mtSystems)||[];
  const namedSystems = systems.map((s,i)=>({idx:i, sys:s, label: SYS_META[s.sysKey]?SYS_META[s.sysKey].l:(s.sysKey||('Sistem '+(i+1)))}));
  let target = null;
  if(namedSystems.length===1){
    target = namedSystems[0];
  } else if(namedSystems.length>1){
    const listStr = namedSystems.map((n,idx)=>(idx+1)+') '+n.label).join('\n');
    const pick = prompt('Hangi sistem için geçmiş kayıt eklenecek?\n'+listStr+'\n\nNumara girin:', '1');
    if(pick===null) return;
    const pickIdx = parseInt(pick.trim(),10)-1;
    if(!(pickIdx>=0 && pickIdx<namedSystems.length)){ showToast('⚠️ Geçersiz seçim.','#d97706'); return; }
    target = namedSystems[pickIdx];
  }

  const sys = target ? target.sys : null;
  const schedule = sys ? mtGenerateSchedule(f.mtBaseDate, f.mtEndDate, sys.freq) : [];

  let occurrence = null;
  let plannedDate = '';
  if(sys && schedule.length){
    const doneCount = sys.doneCount||0;
    if(doneCount>=schedule.length){ showToast('⚠️ Bu sistemin tüm planlanan bakımları zaten tamamlanmış.','#d97706'); return; }
    const optsStr = schedule.map((d,idx)=> idx>=doneCount ? (idx+1)+') '+_toTR(d) : null).filter(Boolean).join('\n');
    const pickN = prompt('Kaçıncı bakım tamamlandı?\n'+optsStr+'\n\nNumara girin:', String(doneCount+1));
    if(pickN===null) return;
    occurrence = parseInt(pickN.trim(),10);
    if(!(occurrence>=doneCount+1 && occurrence<=schedule.length)){ showToast('⚠️ Geçersiz bakım numarası.','#d97706'); return; }
    plannedDate = schedule[occurrence-1];
  }

  const dateStr = prompt('Gerçekleşen ziyaret tarihi (GG.AA.YYYY):', plannedDate ? _toTR(plannedDate) : _toTR(today()));
  if(dateStr===null) return;
  const iso = _toISO(dateStr.trim());
  if(!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)){ showToast('⚠️ Geçersiz tarih formatı. GG.AA.YYYY girin.','#d97706'); return; }

  const label = target ? target.label : '-';
  const note = prompt('Yapılan işlem / not (opsiyonel) — Sistem: '+label, '');
  if(note===null) return;

  const mtSystems = sys ? systems.map((s,i)=> i===target.idx ? Object.assign({}, s, {
    doneCount: occurrence!==null ? occurrence : (s.doneCount||0),
    due: (occurrence!==null && schedule.length) ? (schedule[occurrence]||'') : s.due,
    lastDone: iso
  }) : s) : systems;

  const me = (state.currentUser && state.currentUser.displayName) || '';
  const hist = [...maintHistory(m), {at:iso, by:me, note:note||'', systems:label, occurrence: occurrence||null}];
  const data = {...m, mtSystems, mtHistory:hist, mtNextDue: mtRecordNextDue(mtSystems), ...stamp()};
  await persistMaint(data);
  setState({modal:null});
  showToast('✅ Geçmiş kayıt eklendi: '+_toTR(iso));
}
```

- [ ] **Step 5: JS syntax kontrolü** — Task 1 Step 5'teki komutu çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Elle iz sürme — kaçıncı-bakım akışı**

Senaryo (kullanıcının orijinal örneği): Sözleşme `base=2026-01-01`, `end=2027-01-01`, `freq=3aylik` → `schedule=['2026-04-01','2026-07-01','2026-10-01']`. Tek sistem, `doneCount=0`. Admin "+ Geçmiş Kayıt Ekle" → tek sistem olduğu için sistem sorulmaz → `doneCount(0)>=schedule.length(3)` değil → seçenekler: `1) 01.04.2026`, `2) 01.07.2026`, `3) 01.10.2026` → admin **"2"** girer (2. bakım zaten yapılmış) → `occurrence=2`, `plannedDate=schedule[1]='2026-07-01'` → fiili tarih varsayılan olarak `01.07.2026` gösterilir, admin gerçek tarihi (örn. dün) girebilir → kaydedilince: `doneCount=2`, `due=schedule[2]='2026-10-01'`. **3. ve 4. bakım tarihleri yeniden hesaplanmadan, olduğu gibi kalır** — tam istenen davranış.

- [ ] **Step 7: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Kaçıncı-bakım bazlı geri dönük giriş + tüm kayıtları persistMaint'e bağla

+ Geçmiş Kayıt Ekle artık düz tarih yerine 'kaçıncı bakım tamamlandı'
soruyor; doneCount'u o numaraya ayarlayıp sıradaki vadeyi zaten sabit
programdan (schedule[N]) alıyor — 3./4. bakım tarihleri yeniden
hesaplanmıyor. saveMaint/maintVisitDone/maintDone/geri dönük giriş artık
tek geçit olan persistMaint üzerinden yazıyor (görev senkronu her
yoldan garantili tetiklenir).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Bakım silinince bağlı görevi de sil

**Files:**
- Modify: `APRO_CRM_Firebase.html:1490-1504` (`delItem`)

- [ ] **Step 1: `delItem`'e maintenance cascade ekle**

Mevcut:
```js
async function delItem(col, id) {
  if(col==='proposals') {
    if(!confirm('Bu teklif taslağını silmek istediğinizden emin misiniz?')) return;
  } else {
    if(!confirm('Silmek istiyor musunuz?')) return;
  }
  if(col==='services'){ await cascadeDeleteTasksFor('service', id); }
  await deleteDoc(col, id);
  if(col==='customers') setState({customers:state.customers.filter(x=>x.id!==id)});
  else if(col==='opportunities') setState({opportunities:state.opportunities.filter(x=>x.id!==id)});
  else if(col==='proposals') setState({proposals:state.proposals.filter(x=>x.id!==id)});
  else if(col==='services') setState({services:state.services.filter(x=>x.id!==id)});
  else if(col==='maintenances') setState({maintenances:state.maintenances.filter(x=>x.id!==id)});
  showToast('🗑 Silindi.');
}
```
Yenisi:
```js
async function delItem(col, id) {
  if(col==='proposals') {
    if(!confirm('Bu teklif taslağını silmek istediğinizden emin misiniz?')) return;
  } else {
    if(!confirm('Silmek istiyor musunuz?')) return;
  }
  if(col==='services'){ await cascadeDeleteTasksFor('service', id); }
  if(col==='maintenances'){ await cascadeDeleteTasksFor('maintenance', id); }
  await deleteDoc(col, id);
  if(col==='customers') setState({customers:state.customers.filter(x=>x.id!==id)});
  else if(col==='opportunities') setState({opportunities:state.opportunities.filter(x=>x.id!==id)});
  else if(col==='proposals') setState({proposals:state.proposals.filter(x=>x.id!==id)});
  else if(col==='services') setState({services:state.services.filter(x=>x.id!==id)});
  else if(col==='maintenances') setState({maintenances:state.maintenances.filter(x=>x.id!==id)});
  showToast('🗑 Silindi.');
}
```

- [ ] **Step 2: JS syntax kontrolü** — Task 1 Step 5'teki komutu çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Bakım kaydı silinince bağlı otomatik görevi de sil

cascadeDeleteTasksFor zaten services için kullanılan generic fonksiyon
— maintenance için de aynı desende bağlanıyor (linkType/linkId eşleşen
autoGenerated görevler silinir, manuel eklenenler dokunulmaz).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: `index.html`'i senkronla, CRM tarafını tamamla

**Files:**
- Modify: `APRO_CRM_Firebase.html` → `index.html` (birebir kopya)

- [ ] **Step 1: Kopyala ve doğrula**

```bash
cp APRO_CRM_Firebase.html index.html
diff -q APRO_CRM_Firebase.html index.html && echo SYNCED
```
Expected: `SYNCED`

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "index.html senkronu (deploy kopyası)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

(Push işlemi Task 8'de, kullanıcı onayından sonra yapılır.)

---

### Task 7: Geciken bakım için 2 günde bir mail (nextaura-admin)

**Files:**
- Modify: `TİCARİ CRM & TEKLİF/nextaura-admin/src/lib/crm-reminders.ts`

- [ ] **Step 1: Yeni bloğu 7-gün-önce bloğunun hemen altına ekle**

Mevcut (bu oturumda daha önce düzeltilmiş) blok:
```typescript
  // ⚙️ PERİYODİK BAKIM - 7 gün önce
  for (const m of maintenances) {
    if (!m.mtNextDue) continue;
    if (diffDaysFromToday(m.mtNextDue as string, todayISO) !== 7) continue;
    const name = cn(m.customerId);
    const ilgili = (m.serviceContact as string) || (m.preparedBy as string) || null;
    push(
      'mail_maint_7d_' + m.id,
      getUserEmail(ilgili),
      '⚙️ Bakım 7 Gün Sonra: ' + ((m.jobName as string) || 'Bakım'),
      mailBody('⚙️', 'Periyodik Bakım 7 Gün Sonra', [
        ['İşin Adı', (m.jobName as string) || '-'],
        ['Firma', name],
        ['Bakım Tarihi', _toTR(m.mtNextDue as string)],
        ['İlgili', ilgili || '-'],
      ])
    );
  }

  return out;
}
```
Yenisi (yeni blok araya eklendi):
```typescript
  // ⚙️ PERİYODİK BAKIM - 7 gün önce
  for (const m of maintenances) {
    if (!m.mtNextDue) continue;
    if (diffDaysFromToday(m.mtNextDue as string, todayISO) !== 7) continue;
    const name = cn(m.customerId);
    const ilgili = (m.serviceContact as string) || (m.preparedBy as string) || null;
    push(
      'mail_maint_7d_' + m.id,
      getUserEmail(ilgili),
      '⚙️ Bakım 7 Gün Sonra: ' + ((m.jobName as string) || 'Bakım'),
      mailBody('⚙️', 'Periyodik Bakım 7 Gün Sonra', [
        ['İşin Adı', (m.jobName as string) || '-'],
        ['Firma', name],
        ['Bakım Tarihi', _toTR(m.mtNextDue as string)],
        ['İlgili', ilgili || '-'],
      ])
    );
  }

  // ⚙️ PERİYODİK BAKIM - geciken (vade geçti, 2 günde bir tekrar: 1, 3, 5... gün gecikmede)
  for (const m of maintenances) {
    if (!m.mtNextDue) continue;
    const diff = diffDaysFromToday(m.mtNextDue as string, todayISO);
    if (diff >= 0) continue;
    if (Math.abs(diff) % 2 === 0) continue;
    const name = cn(m.customerId);
    const ilgili = (m.serviceContact as string) || (m.preparedBy as string) || null;
    push(
      'mail_maint_overdue_' + m.id + '_' + todayISO,
      getUserEmail(ilgili),
      '🔴 Bakım Gecikti (' + Math.abs(diff) + ' gün): ' + ((m.jobName as string) || 'Bakım'),
      mailBody('🔴', 'Periyodik Bakım Gecikti', [
        ['İşin Adı', (m.jobName as string) || '-'],
        ['Firma', name],
        ['Planlanan Bakım Tarihi', _toTR(m.mtNextDue as string)],
        ['Gecikme', Math.abs(diff) + ' gün'],
        ['İlgili', ilgili || '-'],
      ])
    );
  }

  return out;
}
```

**Not:** Dedup key'e `todayISO` eklenmesi kasıtlı — mevcut 7-gün-önce key'i (`mail_maint_7d_<id>`) tek seferlik tasarlanmış (aynı gün tekrar denenirse `mailReminders` koleksiyonunda bulunup atlanıyor). Geciken mailin her 2 günde bir **yeniden** gönderilebilmesi için key günlük olmalı; cadence kontrolü (`abs(diff)%2===1`) zaten hangi günlerde push edileceğini sınırlıyor.

- [ ] **Step 2: TypeScript kontrolü**

Run: `npx tsc --noEmit` (proje kökünde: `TİCARİ CRM & TEKLİF/nextaura-admin`)
Expected: `crm-reminders.ts` için hata yok (çıktıda dosya adı geçmemeli).

- [ ] **Step 3: Elle iz sürme**

`todayISO='2026-08-29'`, `m.mtNextDue='2026-08-26'` → `diff=-3` → `diff<0` ✓, `abs(3)%2===1` ✓ → **gönderilir**, konu: "🔴 Bakım Gecikti (3 gün): ...".
`m.mtNextDue='2026-08-27'` → `diff=-2` → `abs(2)%2===0` → **atlanır** (bir sonraki gün, diff=-3'te gönderilecek).
`m.mtNextDue='2026-08-29'` (bugün, henüz gecikmedi) → `diff=0` → `diff>=0` → **atlanır** (doğru, henüz geciken sayılmaz).

- [ ] **Step 4: Commit**

```bash
git add src/lib/crm-reminders.ts
git commit -m "Geciken periyodik bakım için 2 günde bir tekrarlayan mail

7-gün-önce bloğu tek seferlik kalıyor. Yeni blok: vade geçtikten sonra
1, 3, 5... gün gecikmede (2 günde bir) aynı alıcıya tekrar mail atar.
Dedup key günlük (mail_maint_overdue_<id>_<gün>) çünkü mevcut
tek-seferlik key deseni tekrarlı gönderimi engelliyordu.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 8: Onay, push, canlı kabul testi

- [ ] **Step 1: Her iki repo için commit özetini kullanıcıya sun, açık onay bekle**

A-PRO CRM FULL (Task 1-6, 6 commit) ve nextaura-admin (Task 7, 1 commit) — commit mesajları yukarıda; kullanıcıya listelenip "onaylıyorum"/"push" gibi net bir onay beklenir (bu oturumun tüm önceki adımlarında izlenen yöntem).

- [ ] **Step 2: Onay sonrası push**

```bash
cd "/Users/erkankaracakale/Desktop/CLAUDE-HAZIRLANAN PROJE DATABASE/A-PRO PLATFORM/A-PRO CRM FULL" && git push origin main
```
```bash
cd "/Users/erkankaracakale/Desktop/CLAUDE-HAZIRLANAN PROJE DATABASE/A-PRO PLATFORM/TİCARİ CRM & TEKLİF/nextaura-admin" && git push origin main
```

- [ ] **Step 3: Canlıda elle kabul testi (Firebase auth nedeniyle headless yapılamıyor — kullanıcıya bırakılır/birlikte yapılır)**

Kontrol listesi:
1. https://apromuh-gif.github.io/A-PRO-CRM adresinde bir bakım kaydı aç, Bitiş Tarihi gir → numaralı planlanan liste ve "Sonraki Bakım Vadesi" doğru görünüyor mu?
2. Vade tarihini elle 5 gün ileri kaydır → "⚠️ Plandan 5 gün kaydı" rozeti çıkıyor mu?
3. "+ Geçmiş Kayıt Ekle" ile 2. bakımı geri dönük tamamla → 3./4. tarihler değişmeden kalıyor mu, `mtHistory` doğru mu?
4. Personel → Görevler sekmesinde `auto_maint_<id>` görevi doğru kişide, doğru vadede görünüyor mu?
5. İlgili kişiyi değiştirip kaydet → görev yeni kişiye geçti mi, bildirim gitti mi, assignmentHistory'de "sistem" kaydı var mı?
6. Kaydı sil → bağlı görev de siliniyor mu?
7. nextaura-admin: `GET /api/cron/crm-reminders?dry=1&key=<CRON_SECRET>` ile geciken bir test kaydı üzerinden yeni "Bakım Gecikti" hatırlatmasının `reminders` listesinde çıktığını doğrula.
