# Servis-Devreye Alma Formu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Checklist'ten ayrı, yeni bir "A-PRO Servis-Devreye Alma Formu" (müşteriye hizmet verildiğinin dijital imzalı delili) ekler; Arızada tek başına, Devreye Alma/Periyodik Bakımda Checklist ile birlikte kapatma şartı olur.

**Architecture:** Mevcut `checklists` sisteminin (`cl*` fonksiyonları) birebir paraleli, `sf*` önekiyle, ayrı `serviceForms` koleksiyonunda. İmza bileşeni (`clSignPad`) ve rerender yardımcısı (`_clRerender`) checklist'e özgü değil, doğrudan yeniden kullanılır.

**Tech Stack:** Vanilla JS (`APRO_CRM_Firebase.html`, framework yok, `h()` virtual DOM, Firebase Firestore).

**Spec:** `docs/superpowers/specs/2026-08-29-servis-devreye-alma-formu-design.md`

---

## Test Yaklaşımı

Bu projede test çerçevesi yoktur. Doğrulama: (1) `node vm.Script` parse-only syntax kontrolü (her task sonunda zorunlu), (2) DOM/Firebase'e bağımlı olmayan saf mantık (`sfHasFreshCompleted`) için bağımsız `node` betiği ile gerçek `console.assert`, (3) DOM'a bağımlı UI/PDF kodu için satır satır elle iz sürme (plan içinde somut örnek değerlerle).

---

### Task 1: Veri temeli — `loadCollection`, sabitler, `normServiceForm`, `sfHasFreshCompleted`

**Files:**
- Modify: `APRO_CRM_Firebase.html:1310` (koleksiyon yükleme)
- Modify: `APRO_CRM_Firebase.html` (yeni sabitler ve fonksiyonlar — `clHasFreshCompleted` fonksiyonunun hemen altına eklenecek)

- [ ] **Step 1: `serviceForms` koleksiyonunu yükleme listesine ekle**

Bul (satır 1310):
```js
    loadCollection('tasks'), loadCollection('evaluations'), loadCollection('prim'), loadCollection('checklists')
```
Değiştir:
```js
    loadCollection('tasks'), loadCollection('evaluations'), loadCollection('prim'), loadCollection('checklists'), loadCollection('serviceForms')
```

- [ ] **Step 2: Yeni sabitler ve fonksiyonları ekle**

`function clHasFreshCompleted(linkType, linkId, sinceISO){` ile başlayan fonksiyonun kapanış `}`'inin hemen altına (bu fonksiyonu `grep -n "^function clHasFreshCompleted"` ile bul, gövdesi 5 satır, `return !!latest && (!sinceISO || latest >= sinceISO);\n}` ile biter) şunu ekle:

```js
// ── Servis-Devreye Alma Formu (Checklist'ten AYRI, paralel sistem) ─────────
const SF_DOCTYPE_META = { ariza:'Arıza Servis Formu', devreye:'Devreye Alma Servis Formu', bakim:'Periyodik Bakım Servis Formu' };
const APRO_LETTERHEAD = [
  'A-PRO MÜHENDİSLİK LTD. ŞTİ.',
  'Batı Sitesi Mah. 2307/2. Sk. No:13 Yenimahalle — Ankara / Türkiye',
  'Tel: +90 (312) 481 25 00',
  'E-posta: info@a-pro.com.tr',
  'www.a-pro.com.tr'
];
// Tıklanınca tamamı kırmızı dolan seçilebilir kart (hizmet türü + tesis sistemleri seçimi için).
function clRedCard(label, selected, onClick){
  return h('div',{onClick:onClick, style:{
    padding:'10px 14px', borderRadius:'8px',
    border:'1.5px solid '+(selected?'#dc2626':'#cbd5e1'),
    background:selected?'#dc2626':'#fff', color:selected?'#fff':'#334155',
    fontWeight:'700', fontSize:'12.5px', cursor:'pointer', textAlign:'center',
    userSelect:'none', flex:'1 1 auto', minWidth:'110px'
  }}, label);
}
function normServiceForm(sf){
  sf = sf || {};
  return Object.assign({
    id: sf.id, docType: 'ariza', customerId: '', siteName: '', projectId: '',
    linkType: '', linkId: '', systemsPresent: [],
    description: '', custContact: {name:'',phone:''}, staffContact: {name:'',phone:''},
    staffSign: {name:'',dataURL:'',at:''}, custSign: {name:'',dataURL:'',at:''},
    status: 'taslak', createdAt: (sf.createdAt || today())
  }, sf, {
    systemsPresent: Array.isArray(sf.systemsPresent) ? sf.systemsPresent : [],
    custContact: Object.assign({name:'',phone:''}, sf.custContact || {}),
    staffContact: Object.assign({name:'',phone:''}, sf.staffContact || {}),
    staffSign: Object.assign({name:'',dataURL:'',at:''}, sf.staffSign || {}),
    custSign: Object.assign({name:'',dataURL:'',at:''}, sf.custSign || {})
  });
}
// clLatestCompletedAt/clHasFreshCompleted ile BİREBİR aynı mantık, state.serviceForms üzerinde.
function sfLatestCompletedAt(linkType, linkId){
  var list = (state.serviceForms||[]).filter(function(x){ return x.linkType===linkType && x.linkId===linkId && x.status==='tamam'; });
  if(!list.length) return null;
  return list.map(function(x){ return x.createdAt; }).sort().pop();
}
function sfHasFreshCompleted(linkType, linkId, sinceISO){
  var latest = sfLatestCompletedAt(linkType, linkId);
  return !!latest && (!sinceISO || latest >= sinceISO);
}
```

- [ ] **Step 3: JS syntax kontrolü**

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

- [ ] **Step 4: Bağımsız doğrulama betiği — `sfHasFreshCompleted` mantığı**

`/private/tmp/claude-501/-Users-erkankaracakale/ff02a765-e93b-4881-9a67-5db7fd5f3aa2/scratchpad/test-sf-fresh.js`:

```js
// ↓↓↓ Task 1 Step 2'de dosyaya yapıştırılan KOD İLE BİREBİR AYNI ↓↓↓
function sfLatestCompletedAt(linkType, linkId, serviceForms){
  var list = (serviceForms||[]).filter(function(x){ return x.linkType===linkType && x.linkId===linkId && x.status==='tamam'; });
  if(!list.length) return null;
  return list.map(function(x){ return x.createdAt; }).sort().pop();
}
function sfHasFreshCompleted(linkType, linkId, sinceISO, serviceForms){
  var latest = sfLatestCompletedAt(linkType, linkId, serviceForms);
  return !!latest && (!sinceISO || latest >= sinceISO);
}
// ↑↑↑ (test'te state.serviceForms yerine parametre olarak geçiriliyor, mantık aynı) ↑↑↑

var forms = [
  {linkType:'maintenance', linkId:'m1', status:'tamam', createdAt:'2026-08-01'},
  {linkType:'maintenance', linkId:'m1', status:'taslak', createdAt:'2026-09-01'}, // imzasız, sayılmaz
  {linkType:'service', linkId:'s1', status:'tamam', createdAt:'2026-08-15'}
];

// Servis: sinceISO='' → herhangi bir zamanda tamamlanmış form yeterli.
console.assert(sfHasFreshCompleted('service','s1','',forms)===true, 'FAIL: service should be completed');
console.assert(sfHasFreshCompleted('service','s2','',forms)===false, 'FAIL: unknown service should not be completed');

// Bakım: bir önceki ziyaretten (mtLastDone) SONRA tamamlanmış olmalı.
console.assert(sfHasFreshCompleted('maintenance','m1','2026-07-01',forms)===true, 'FAIL: form after last visit should count');
console.assert(sfHasFreshCompleted('maintenance','m1','2026-08-05',forms)===false, 'FAIL: form BEFORE the cutoff should not count (only taslak exists after)');

console.log('✅ ALL ASSERTIONS PASSED');
```

- [ ] **Step 5: Betiği çalıştır**

`node /private/tmp/claude-501/-Users-erkankaracakale/ff02a765-e93b-4881-9a67-5db7fd5f3aa2/scratchpad/test-sf-fresh.js`
Expected: `✅ ALL ASSERTIONS PASSED`

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Servis Formu: veri temeli (koleksiyon, sabitler, normServiceForm, sfHasFreshCompleted)

Checklist sisteminden ayrı, paralel yeni serviceForms koleksiyonu için
temel: normServiceForm (normChecklist deseni), sfHasFreshCompleted
(clHasFreshCompleted deseni), SF_DOCTYPE_META, APRO_LETTERHEAD
(Teklif Programı PDF üst bilgisi), clRedCard (kırmızı seçim kartı,
hem hizmet türü hem sistem seçiminde kullanılacak).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: CRUD — `sfSave`, `sfDelete`, `openServiceForm`, `sfListBlock`

**Files:**
- Modify: `APRO_CRM_Firebase.html` (Task 1'de eklenen bloğun hemen altına)

- [ ] **Step 1: Fonksiyonları ekle**

Task 1'de eklediğiniz `sfHasFreshCompleted` fonksiyonunun hemen altına:

```js
async function sfSave(sf){
  sf.status = (sf.staffSign && sf.staffSign.name && sf.custSign && sf.custSign.name) ? 'tamam' : 'taslak';
  sf._editedBy = (state.currentUser && state.currentUser.displayName) || '';
  sf._editedAt = today();
  if(!sf.createdAt) sf.createdAt = today();
  setState({saving:true});
  await saveDoc('serviceForms', sf.id, sf);
  var list = (state.serviceForms||[]).slice();
  var i = list.findIndex(function(x){ return x.id===sf.id; });
  if(i>=0) list[i]=sf; else list.push(sf);
  setState({serviceForms:list, modal:null, saving:false});
  showToast('✅ Servis Formu kaydedildi');
}
async function sfDelete(id){
  if(!confirm('Bu servis formu kalıcı olarak silinsin mi?')) return;
  await deleteDoc('serviceForms', id);
  setState({serviceForms:(state.serviceForms||[]).filter(function(x){ return x.id!==id; }), modal:null});
  showToast('🗑 Servis formu silindi');
}
// Açıcı: opts { docType, customerId, siteName, projectId, linkType, linkId, staffName, id }
function openServiceForm(opts){
  opts = opts || {};
  var existing = opts.id ? (state.serviceForms||[]).find(function(x){ return x.id===opts.id; }) : null;
  var sf = normServiceForm(existing ? JSON.parse(JSON.stringify(existing)) : {
    id: genId(),
    docType: opts.docType || 'ariza',
    customerId: opts.customerId || '',
    siteName: opts.siteName || '',
    projectId: opts.projectId || '',
    linkType: opts.linkType || '',
    linkId: opts.linkId || '',
    staffContact: {name: opts.staffName||'', phone:''},
    createdAt: today()
  });
  setState({modal:{type:'serviceform', item:sf}});
}
// Bir kayda bağlı servis formu listesi + yeni buton bloğu (modal içi giriş noktası).
function sfListBlock(opts){
  var list = (state.serviceForms||[]).filter(function(x){ return x.linkType===opts.linkType && x.linkId===opts.linkId; });
  var rows = list.map(function(sf){
    return h('div',{style:{display:'flex',alignItems:'center',gap:'8px',padding:'6px 8px',border:'1px solid #e2e8f0',borderRadius:'8px',marginBottom:'6px',background:'#fff'}},
      h('span',{style:{flex:'1',fontSize:'13px'}}, (SF_DOCTYPE_META[sf.docType]||sf.docType)+' · '+_toTR(sf.createdAt)+' · '+(sf.status==='tamam'?'✅ Tamam':'✏️ Taslak')),
      btn('Aç', function(){ setState({modal:{type:'serviceform', item:sf}}); }, '#2563eb', '#fff', '5px 12px', {fontSize:'12px'}),
      btn('PDF', function(){ printServiceForm(sf); }, '#0891b2', '#fff', '5px 12px', {fontSize:'12px'}));
  });
  return h('div',{style:{marginTop:'12px',paddingTop:'12px',borderTop:'1px solid #e2e8f0'}},
    h('div',{style:{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}},
      h('div',{style:{fontWeight:'800',fontSize:'14px',flex:'1',color:'#0f1f35'}}, '📝 Servis-Devreye Alma Formu'),
      btn('+ Yeni Servis Formu', function(){ openServiceForm(opts.newOpts); }, '#dc2626', '#fff', '6px 13px', {fontSize:'12px'})),
    rows.length ? h('div',{}, ...rows) : h('div',{style:{fontSize:'12px',color:'#94a3b8'}}, 'Henüz servis formu yok.'));
}
```

Not: bu adımdan sonra `printServiceForm` (Task 4'te eklenecek) henüz tanımlı değil — bu normaldir, `function` bildirimleri dosya genelinde hoisted olduğundan (üstte tanımlı olmasa bile) syntax hatası vermez; sadece PDF butonuna basılırsa (bu task bitmeden) hata verir, bu beklenen ve geçicidir.

- [ ] **Step 2: JS syntax kontrolü**

Task 1 Step 3'teki komutu çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Servis Formu: CRUD + giriş noktası bileşeni (sfSave/sfDelete/openServiceForm/sfListBlock)

clSave/clDelete/openChecklist/clListBlock ile birebir aynı desende,
ayrı serviceForms koleksiyonu için. Henüz hiçbir ekrana bağlanmadı
(Task 5'te bağlanacak) — bu adımda amaç yalnız fonksiyonların doğru
tanımlanması.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Doldurma ekranı — `buildServiceFormModal`

**Files:**
- Modify: `APRO_CRM_Firebase.html` (Task 2'de eklenen bloğun hemen altına)

- [ ] **Step 1: Fonksiyonu ekle**

`sfListBlock` fonksiyonunun hemen altına:

```js
function buildServiceFormModal(sf){
  sf = normServiceForm(sf); state.modal.item = sf;
  var rerender = _clRerender;
  var custOpts = [{v:'',l:'Müşteri seçin…'}].concat(
    [].concat(state.customers||[]).sort(function(a,b){ return (a.firmName||'').localeCompare(b.firmName||'','tr'); })
      .map(function(x){ return {v:x.id, l:x.firmName||'(isimsiz)'}; }));

  var docTypeCards = h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}},
    ...[{v:'ariza',l:'Arıza / Servis'},{v:'devreye',l:'Devreye Alma'},{v:'bakim',l:'Periyodik Bakım'}].map(function(o){
      return clRedCard(o.l, sf.docType===o.v, function(){ sf.docType=o.v; rerender(); });
    }));

  var header = h('div',{style:{display:'flex',flexWrap:'wrap',gap:'10px',marginBottom:'12px'}},
    h('div',{style:{flex:'1 1 220px'}}, h('div',{style:{fontSize:'12px',color:'#64748b',marginBottom:'3px'}},'Müşteri'),
      _clSelect(custOpts, sf.customerId, function(v){ sf.customerId=v; })),
    h('div',{style:{flex:'1 1 220px'}}, h('div',{style:{fontSize:'12px',color:'#64748b',marginBottom:'3px'}},'Saha / Bina Adı'),
      h('input',{value:sf.siteName||'', placeholder:'Örn. Merkez Bina, A Blok', oninput:function(e){ sf.siteName=e.target.value; }, style:_clInputStyle()})),
    h('div',{style:{flex:'0 0 150px'}}, h('div',{style:{fontSize:'12px',color:'#64748b',marginBottom:'3px'}},'Tarih'),
      h('input',{type:'date', value:sf.createdAt||today(), oninput:function(e){ sf.createdAt=e.target.value; }, style:_clInputStyle()})));

  var sysCards = h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}},
    ...Object.keys(SYS_META).map(function(k){
      var on = (sf.systemsPresent||[]).indexOf(k)>=0;
      return clRedCard(SYS_META[k].l, on, function(){
        var idx = sf.systemsPresent.indexOf(k);
        if(idx>=0) sf.systemsPresent.splice(idx,1); else sf.systemsPresent.push(k);
        rerender();
      });
    }));

  var descBox = h('textarea',{placeholder:'Yapılan hizmetin açıklaması...', style:Object.assign(_clInputStyle(),{minHeight:'90px',resize:'vertical'})}, sf.description||'');
  descBox.addEventListener('input', function(e){ sf.description=e.target.value; });

  var custContactRow = h('div',{style:{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'6px'}},
    h('div',{style:{flex:'1 1 200px'}}, h('input',{value:sf.custContact.name||'', placeholder:'Müşteri İlgilisi - Ad Soyad', oninput:function(e){ sf.custContact.name=e.target.value; }, style:_clInputStyle()})),
    h('div',{style:{flex:'1 1 160px'}}, h('input',{value:sf.custContact.phone||'', placeholder:'Telefon', oninput:function(e){ sf.custContact.phone=e.target.value; }, style:_clInputStyle()})));
  var staffContactRow = h('div',{style:{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'14px'}},
    h('div',{style:{flex:'1 1 200px'}}, h('input',{value:sf.staffContact.name||'', placeholder:'Servis Personeli - Ad Soyad', oninput:function(e){ sf.staffContact.name=e.target.value; }, style:_clInputStyle()})),
    h('div',{style:{flex:'1 1 160px'}}, h('input',{value:sf.staffContact.phone||'', placeholder:'Telefon', oninput:function(e){ sf.staffContact.phone=e.target.value; }, style:_clInputStyle()})));

  var signs = h('div',{style:{marginTop:'14px',paddingTop:'14px',borderTop:'2px solid #e2e8f0'}},
    h('div',{style:{fontWeight:'800',fontSize:'14px',marginBottom:'8px',color:'#0f1f35'}}, 'İmzalar (dijital + ıslak)'),
    h('div',{style:{display:'flex',flexWrap:'wrap',gap:'18px'}},
      clSignPad(sf, sf.staffSign, 'A-Pro Yetkilisi', 'sfsig-staff', (state.users||[]).filter(function(u){return u.active!==false;}).map(function(u){return u.displayName;}).sort(function(a,b){return a.localeCompare(b,'tr');})),
      clSignPad(sf, sf.custSign, 'Müşteri Yetkilisi', 'sfsig-cust')));

  var isExisting = (state.serviceForms||[]).some(function(x){ return x.id===sf.id; });
  var footer = h('div',{style:{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'16px'}},
    btn('💾 Kaydet', function(){ sfSave(sf); }, '#16a34a'),
    btn('🖨️ PDF / Yazdır', function(){ printServiceForm(sf); }, '#0891b2'),
    isExisting ? btn('🗑 Sil', function(){ sfDelete(sf.id); }, '#dc2626') : '',
    btn('Kapat', function(){ setState({modal:null}); }, '#64748b'));

  var body = h('div',{},
    header,
    h('div',{style:{fontSize:'12px',color:'#64748b',marginBottom:'6px',fontWeight:'700'}},'HİZMET TÜRÜ'), docTypeCards,
    h('div',{style:{fontSize:'12px',color:'#64748b',marginBottom:'6px',fontWeight:'700'}},'TESİSTEKİ SİSTEMLER'), sysCards,
    h('div',{style:{fontSize:'12px',color:'#64748b',marginBottom:'6px',fontWeight:'700'}},'YAPILAN HİZMET'), descBox,
    h('div',{style:{fontSize:'12px',color:'#64748b',margin:'14px 0 6px',fontWeight:'700'}},'MÜŞTERİ İLGİLİSİ'), custContactRow,
    h('div',{style:{fontSize:'12px',color:'#64748b',marginBottom:'6px',fontWeight:'700'}},'SERVİS PERSONELİ'), staffContactRow,
    signs, footer);
  return modal(SF_DOCTYPE_META[sf.docType]||'Servis-Devreye Alma Formu', body, function(){ setState({modal:null}); }, '820px');
}
```

- [ ] **Step 2: JS syntax kontrolü**

Task 1 Step 3'teki komutu çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Elle iz sürme (kod okuyarak doğrula)**

Senaryo: `sf.docType='ariza'`, admin "Devreye Alma" kartına tıklar. `docTypeCards`'ın 2. elemanının onClick'i çalışır → `sf.docType='devreye'` → `rerender()` (`_clRerender` = `setState({modal:state.modal})`) → tüm modal yeniden çizilir → `buildServiceFormModal` tekrar çağrılır, bu sefer `sf.docType==='devreye'` olduğundan `docTypeCards`'ta artık **yalnızca 2. kart** kırmızı (`selected` koşulu `sf.docType===o.v` her kart için ayrı ayrı değerlendirildiği için otomatik tekli-seçim sağlanır — ayrı bir "diğerlerini temizle" koduna gerek yok).

Senaryo: `sf.systemsPresent=['sprinkler']`, admin "Yangın Pompası" kartına tıklar (henüz seçili değil). `sysCards`'taki ilgili kartın onClick'i: `idx = sf.systemsPresent.indexOf('pompa')` = -1 → `sf.systemsPresent.push('pompa')` → `['sprinkler','pompa']` → rerender → her iki kart da artık kırmızı. Aynı karta tekrar tıklanırsa `idx>=0` → `splice` ile çıkarılır → toggle davranışı doğru.

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Servis Formu: doldurma ekranı (buildServiceFormModal)

Hizmet türü (tekli, kırmızı kart) + tesisteki sistemler (çoklu,
kırmızı kart) + müşteri/saha/tarih + yapılan hizmet açıklaması +
müşteri ilgilisi/servis personeli bilgisi + clSignPad ile iki imza.
Henüz modal dispatch'e bağlanmadı (Task 5).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: PDF — `printServiceForm`

**Files:**
- Modify: `APRO_CRM_Firebase.html` (Task 3'te eklenen bloğun hemen altına)

- [ ] **Step 1: Fonksiyonu ekle**

`buildServiceFormModal` fonksiyonunun hemen altına:

```js
function printServiceForm(sf){
  sf = normServiceForm(sf);
  var cust = (state.customers||[]).find(function(x){ return x.id===sf.customerId; });
  var proj = sf.projectId ? (state.opportunities||[]).find(function(x){ return x.id===sf.projectId; }) : null;
  function infoRow(lbl, val){ return '<tr><td class="lbl">'+escapeHtml(lbl)+'</td><td>'+escapeHtml(val||'—')+'</td></tr>'; }
  var infoGrid = '<table class="infogrid"><tbody>'
    + infoRow('Müşteri', cust?(cust.firmName||'—'):'—')
    + infoRow('Saha / Bina', sf.siteName)
    + infoRow('Proje', proj?(proj.title||'—'):'—')
    + infoRow('Tarih', _toTR(sf.createdAt||today()))
    + infoRow('Referans', String(sf.id).slice(-8).toUpperCase())
    + '</tbody></table>';
  var sysLabels = (sf.systemsPresent||[]).map(function(k){ return (SYS_META[k]&&SYS_META[k].l)||k; });
  function signBox(s, role){
    var img = s.dataURL ? '<img src="'+s.dataURL+'" class="sig"/>' : '<div class="sig"></div>';
    return '<div class="signbox"><div class="role">'+role+'</div>'+img+'<div class="sigline">Ad Soyad: '+escapeHtml(s.name||'')+'</div><div class="sigline">Tarih: '+escapeHtml(s.at?_toTR(s.at):'')+'</div><div class="sigline">İmza (ıslak): ______________________</div></div>';
  }
  var html = ''
   + '<style>@media print{.no-print{display:none!important;}} @page{margin:14mm;} body{font-family:Arial,Helvetica,sans-serif;color:#111;} .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #c00000;padding-bottom:10px;margin-bottom:14px;} .hd img{height:56px;} .letterhead{text-align:right;font-size:11px;color:#333;line-height:1.6;} .letterhead b{display:block;font-size:13px;color:#111;margin-bottom:2px;} .secbar{background:#c00000;color:#fff;font-weight:700;font-size:12px;padding:6px 10px;text-transform:uppercase;letter-spacing:.03em;margin:14px 0 8px;} .infogrid{width:100%;border-collapse:collapse;margin-bottom:6px;} .infogrid td{border:1px solid #e2e8f0;padding:7px 10px;font-size:12px;} .infogrid td.lbl{background:#f5f5f5;font-weight:700;color:#333;width:22%;} .badges{font-size:12px;} .badge{display:inline-block;background:#fdecec;color:#7a0e0e;border:1px solid #f3b8b8;border-radius:14px;padding:3px 10px;margin:0 6px 6px 0;font-weight:700;} .desc{font-size:12.5px;white-space:pre-wrap;line-height:1.6;} .parties{display:flex;gap:20px;} .parties>div{flex:1;} .signs{display:flex;gap:24px;margin-top:26px;page-break-inside:avoid;} .signbox{flex:1;} .role{font-weight:700;font-size:13px;margin-bottom:4px;} img.sig,.sig{display:block;width:220px;height:80px;border:1px solid #cbd5e1;border-radius:6px;object-fit:contain;} .sigline{font-size:12px;margin-top:4px;} .foot{margin-top:24px;font-size:10px;color:#94a3b8;text-align:center;}</style>'
   + '<div class="hd"><img src="'+APRO_LOGO_DATAURI+'"/><div class="letterhead">' + APRO_LETTERHEAD.map(function(l,i){ return i===0?('<b>'+escapeHtml(l)+'</b>'):escapeHtml(l)+'<br/>'; }).join('') + '</div></div>'
   + '<h1 style="font-size:16px;margin:0 0 10px;color:#0f1f35;">'+escapeHtml(SF_DOCTYPE_META[sf.docType]||'Servis-Devreye Alma Formu')+'</h1>'
   + infoGrid
   + '<div class="secbar">Hizmet Türü</div><div class="badges"><span class="badge">'+escapeHtml(SF_DOCTYPE_META[sf.docType]||sf.docType)+'</span></div>'
   + '<div class="secbar">Tesisteki Sistemler</div><div class="badges">'+(sysLabels.length?sysLabels.map(function(l){return '<span class="badge">'+escapeHtml(l)+'</span>';}).join(''):'<span style="color:#94a3b8;font-size:12px;">Belirtilmedi</span>')+'</div>'
   + '<div class="secbar">Yapılan Hizmet</div><div class="desc">'+escapeHtml(sf.description||'—')+'</div>'
   + '<div class="secbar">Taraflar</div><div class="parties">'
     + '<div><b style="font-size:12px;">Müşteri İlgilisi</b><div style="font-size:12px;margin-top:3px;">'+escapeHtml(sf.custContact.name||'—')+(sf.custContact.phone?(' · '+escapeHtml(sf.custContact.phone)):'')+'</div></div>'
     + '<div><b style="font-size:12px;">Servis Personeli</b><div style="font-size:12px;margin-top:3px;">'+escapeHtml(sf.staffContact.name||'—')+(sf.staffContact.phone?(' · '+escapeHtml(sf.staffContact.phone)):'')+'</div></div>'
   + '</div>'
   + '<div class="signs">'+signBox(sf.staffSign,'A-Pro Yetkilisi')+signBox(sf.custSign,'Müşteri Yetkilisi')+'</div>'
   + '<div class="foot">A-PRO Mühendislik · Hizmet teslim formu · Bu belge dijital ve ıslak imza ile geçerlidir.</div>';
  var ep = document.getElementById('print-overlay'); if(ep) ep.remove();
  var po = document.createElement('div'); po.id='print-overlay'; po.style.cssText='position:fixed;inset:0;z-index:99999;background:#fff;display:flex;flex-direction:column;';
  var bar = document.createElement('div'); bar.className='no-print'; bar.style.cssText='display:flex;gap:8px;padding:10px;border-bottom:1px solid #e2e8f0;';
  var pb = document.createElement('button'); pb.textContent='🖨️ Yazdır'; pb.style.cssText='padding:8px 18px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;'; pb.onclick=function(){ window.print(); };
  var cb = document.createElement('button'); cb.textContent='✕ Kapat'; cb.style.cssText='padding:8px 18px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;'; cb.onclick=function(){ po.remove(); };
  bar.appendChild(pb); bar.appendChild(cb);
  var content = document.createElement('div'); content.style.cssText='overflow:auto;padding:24px;'; content.innerHTML=html;
  po.appendChild(bar); po.appendChild(content); document.body.appendChild(po);
}
```

- [ ] **Step 2: JS syntax kontrolü**

Task 1 Step 3'teki komutu çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Elle iz sürme**

Senaryo: `sf.docType='bakim'`, `sf.systemsPresent=['sprinkler','pompa']`, `sf.description='Tüm sistemler test edildi, uygun bulundu.'`. `SF_DOCTYPE_META['bakim']` = `'Periyodik Bakım Servis Formu'` → başlık ve "Hizmet Türü" rozeti bu metni gösterir. `sysLabels` = `['Sprinkler Sistemi','Yangın Pompası']` (SYS_META'dan) → iki rozet basılır. `escapeHtml(sf.description)` → `.desc` bloğunda `white-space:pre-wrap` sayesinde satır sonları korunur.

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Servis Formu: PDF çıktısı (printServiceForm)

printChecklist'in print-overlay + window.print() deseni; Teklif
Programı PDF'indeki görsel dil (APRO_LETTERHEAD üst bilgi, kırmızı
bölüm başlıkları, bilgi grid'i) kullanılır. clSignPad ile atılan
dijital imzalar + ıslak imza satırları basılır.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: Bağlama — modal dispatch + 3 giriş noktası

**Files:**
- Modify: `APRO_CRM_Firebase.html` (modal dispatch switch)
- Modify: `APRO_CRM_Firebase.html:5960` (`buildArizaModal`)
- Modify: `APRO_CRM_Firebase.html:7741` (`buildBakimModal`)
- Modify: `APRO_CRM_Firebase.html:8384` (`buildProjeModal`)

- [ ] **Step 1: Modal dispatch'e yeni tip ekle**

Bul:
```js
    else if(type==='checklist') m=buildChecklistModal(item);
```
Hemen altına ekle:
```js
    else if(type==='serviceform') m=buildServiceFormModal(item);
```

- [ ] **Step 2: `buildArizaModal`'a giriş noktası ekle**

Bul:
```js
  content.appendChild(clListBlock({ linkType:'service', linkId:s.id, newOpts:{ formType:'ariza', customerId:s.customerId||'', siteName:(cust&&cust.firmName)||'', linkType:'service', linkId:s.id } }));
```
Hemen altına ekle:
```js
  content.appendChild(sfListBlock({ linkType:'service', linkId:s.id, newOpts:{ docType:'ariza', customerId:s.customerId||'', siteName:(cust&&cust.firmName)||'', staffName:s.preparedBy||'', linkType:'service', linkId:s.id } }));
```

- [ ] **Step 3: `buildBakimModal`'a giriş noktası ekle**

Bul:
```js
  content.appendChild(clListBlock({ linkType:'maintenance', linkId:m.id, newOpts:{ formType:'bakim', customerId:m.customerId||'', siteName:(cust&&cust.firmName)||'', linkType:'maintenance', linkId:m.id } }));
```
Hemen altına ekle:
```js
  content.appendChild(sfListBlock({ linkType:'maintenance', linkId:m.id, newOpts:{ docType:'bakim', customerId:m.customerId||'', siteName:(cust&&cust.firmName)||'', staffName:m.serviceContact||'', linkType:'maintenance', linkId:m.id } }));
```

- [ ] **Step 4: `buildProjeModal`'a giriş noktası ekle**

Bul:
```js
  content.appendChild(clListBlock({ linkType:'project', linkId:o.id, newOpts:{ formType:'devreye', customerId:o.customerId||'', siteName:o.title||((cust&&cust.firmName)||''), projectId:o.id, linkType:'project', linkId:o.id } }));
```
Hemen altına ekle:
```js
  content.appendChild(sfListBlock({ linkType:'project', linkId:o.id, newOpts:{ docType:'devreye', customerId:o.customerId||'', siteName:o.title||((cust&&cust.firmName)||''), projectId:o.id, linkType:'project', linkId:o.id } }));
```

- [ ] **Step 5: JS syntax kontrolü**

Task 1 Step 3'teki komutu çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Servis Formu: modal dispatch + 3 giriş noktası (Arıza/Bakım/Proje)

Checklist giriş noktalarının (clListBlock) yanına, aynı desende
sfListBlock eklendi — Servis Formu artık her üç ekrandan açılabiliyor.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Kapatma kilidi — nihai karar

**Files:**
- Modify: `APRO_CRM_Firebase.html` (`servClose`, `maintVisitDone`, `maintDone`, `projClose`)

- [ ] **Step 1: `servClose` — checklist kilidini KALDIR, Servis Formu kilidi EKLE**

Bul:
```js
async function servClose(s){
  if(!clHasFreshCompleted('service', s.id, '')){ showToast('⚠️ Arıza kapatılmadan önce NFPA Checklist doldurulup personel+müşteri imzasıyla tamamlanmalı.','#d97706'); return; }
  const note=prompt('Kapanış — yapılan işlem + değişen parça (opsiyonel):', s.execCloseNote||'');
```
Değiştir:
```js
async function servClose(s){
  if(!sfHasFreshCompleted('service', s.id, '')){ showToast('⚠️ Arıza kapatılmadan önce Servis Formu doldurulup personel+müşteri imzasıyla tamamlanmalı.','#d97706'); return; }
  const note=prompt('Kapanış — yapılan işlem + değişen parça (opsiyonel):', s.execCloseNote||'');
```

(Nihai karar: Arızada NFPA Checklist zorunlu DEĞİL, yalnız Servis Formu zorunlu — bu oturumun daha önceki bir adımında checklist kilidi eklenmişti, şimdi bilinçli olarak kaldırılıp Servis Formu ile değiştiriliyor.)

- [ ] **Step 2: `maintVisitDone`'a Servis Formu kilidi EKLE (checklist kilidine ek olarak, o kalır)**

Bul:
```js
  if(!clHasFreshCompleted('maintenance', m.id, m.mtLastDone||'')){ showToast('⚠️ Bu ziyaret için önce NFPA Checklist doldurulup personel+müşteri imzasıyla tamamlanmalı.','#d97706'); return; }
```
Bu satırın `async function maintVisitDone(m){` içindeki kopyasının (dosyada bu tam metin `maintDone` içinde de var — YALNIZCA `maintVisitDone` fonksiyonunun İÇİNDEKİ kopyayı değiştirin, `maintDone` için Step 3'e bakın) hemen altına ekleyin:
```js
  if(!sfHasFreshCompleted('maintenance', m.id, m.mtLastDone||'')){ showToast('⚠️ Bu ziyaret için önce Servis Formu doldurulup personel+müşteri imzasıyla tamamlanmalı.','#d97706'); return; }
```

- [ ] **Step 3: `maintDone`'a Servis Formu kilidi EKLE**

`async function maintDone(m){` içindeki (Step 2'dekiyle birebir aynı metin ama farklı fonksiyonun içinde) satırın hemen altına aynı satırı ekleyin:
```js
  if(!sfHasFreshCompleted('maintenance', m.id, m.mtLastDone||'')){ showToast('⚠️ Bu ziyaret için önce Servis Formu doldurulup personel+müşteri imzasıyla tamamlanmalı.','#d97706'); return; }
```

- [ ] **Step 4: `projClose`'a HER İKİ kilidi EKLE (şu an hiç kilidi yok)**

Bul:
```js
async function projClose(o){
  if(!confirm('Proje kapatılsın mı? (Hakediş/kapanış tamamlandı)')) return;
```
Değiştir:
```js
async function projClose(o){
  if(!clHasFreshCompleted('project', o.id, '')){ showToast('⚠️ Proje kapatılmadan önce Devreye Alma Checklist doldurulup personel+müşteri imzasıyla tamamlanmalı.','#d97706'); return; }
  if(!sfHasFreshCompleted('project', o.id, '')){ showToast('⚠️ Proje kapatılmadan önce Servis Formu doldurulup personel+müşteri imzasıyla tamamlanmalı.','#d97706'); return; }
  if(!confirm('Proje kapatılsın mı? (Hakediş/kapanış tamamlandı)')) return;
```

- [ ] **Step 5: JS syntax kontrolü**

Task 1 Step 3'teki komutu çalıştır. Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Elle doğrulama — nihai tablo**

| Eylem | Checklist | Servis Formu |
|---|---|---|
| `servClose` | ❌ (kaldırıldı) | ✅ |
| `maintVisitDone` | ✅ (zaten vardı) | ✅ (yeni) |
| `maintDone` | ✅ (zaten vardı) | ✅ (yeni) |
| `projClose` | ✅ (yeni) | ✅ (yeni) |

Dosyada `grep -n "clHasFreshCompleted('service'"` **sıfır sonuç** vermeli (kaldırıldı). `grep -n "sfHasFreshCompleted("` **4 sonuç** vermeli (servClose, maintVisitDone, maintDone, projClose).

- [ ] **Step 7: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "Kapatma kilidi: Arızada yalnız Servis Formu, Bakım/Devreye'de ikisi de

servClose: NFPA Checklist kilidi kaldırıldı, Servis Formu kilidi
eklendi (nihai karar — arızada checklist zorunlu değil).
maintVisitDone/maintDone: mevcut checklist kilidine ek olarak Servis
Formu kilidi eklendi. projClose: hiç kilidi yoktu, artık hem Checklist
hem Servis Formu zorunlu (Devreye Alma).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 7: `index.html` senkronu

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

---

### Task 8: Onay, push, canlı kabul testi

- [ ] **Step 1: Commit özetini sun, açık onay bekle**

7 commit (Task 1-7) — kullanıcıya listelenip net onay ("onaylıyorum"/"push") beklenir.

- [ ] **Step 2: Onay sonrası push**

```bash
cd "/Users/erkankaracakale/Desktop/CLAUDE-HAZIRLANAN PROJE DATABASE/A-PRO PLATFORM/A-PRO CRM FULL" && git push origin main
```

- [ ] **Step 3: Canlıda elle kabul testi (Firebase auth nedeniyle headless yapılamıyor)**

1. Bir arıza kaydı aç → "+ Yeni Servis Formu" → Hizmet Türü'nde "Arıza" kartına tıkla (kırmızı dolmalı) → 2 sistem seç (kırmızı dolmalı, tekrar tıklayınca kalksın) → açıklama yaz → iki imza at (personel + müşteri, ekrana çizerek) → Kaydet.
2. Aynı arızayı "Arızayı Kapat" ile kapatmayı dene → **artık engellenmiyor** (form imzalı).
3. İmzasız yeni bir arızada "Arızayı Kapat" dene → **engelleniyor**, uyarı çıkıyor.
4. Bir periyodik bakım kaydında hem Checklist hem Servis Formu doldurmadan "Ziyareti Tamamla" dene → engelleniyor; ikisini de imzala → artık tamamlanabiliyor.
5. Bir proje (devreye alma) kaydında "Projeyi Kapat" dene → Checklist + Servis Formu istiyor; ikisini de doldurup imzala → kapanıyor.
6. Servis Formu PDF'ini aç → logo + A-PRO Mühendislik üst bilgisi + kırmızı bölüm başlıkları + seçili hizmet türü/sistemler + imza blokları doğru görünüyor mu kontrol et.
