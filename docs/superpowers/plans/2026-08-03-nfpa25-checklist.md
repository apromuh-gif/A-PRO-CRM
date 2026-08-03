# NFPA 25 Servis Checklist Sistemi — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CRM'e (`APRO_CRM_Firebase.html`), sistem-bazında NFPA-temelli Türkçe tik-checklist doldurma, çift imza (dijital + ıslak) ve A-PRO logolu A4 PDF çıktısı veren `checklists` modülü eklemek.

**Architecture:** Tek dosya CRM içinde: (1) gömülü şablon verisi + pure accessor/filter fonksiyonları (Node ile test edilir), (2) `checklists` Firestore koleksiyonu + save/delete + state (Faz 3b `saveMaint` deseni), (3) mobil-uyumlu doldurma ekranı + `<canvas>` imza, (4) `print-overlay` + `window.print()` ile A-PRO logolu PDF. Giriş noktaları: Teknik Servis / Periyodik Bakım / Proje-müşteri modalları.

**Tech Stack:** Vanilla JS, custom `h()` vDOM, Firebase Firestore, Node `vm`/`Function` test harness (mevcut `faz3b-harness.js` deseni), `window.print()` PDF.

**Referans:** Spec `docs/superpowers/specs/2026-08-03-nfpa25-checklist-design.md`. Her HTML değişikliğinden sonra: `bash docs/superpowers/tests/syntax.sh` → `✅ SYNTAX OK`.

**Kritik kurallar (CLAUDE.md):**
- Tek tırnak string içinde Türkçe kesme (`'`) kullanma → `&#39;` veya template literal.
- `new Date("ISO")` yerine `_toDate()`.
- CSS class ile gizleme çalışmaz → inline style; PDF gizleme için `@media print`.
- Deploy YALNIZ kullanıcı "deploy" dediğinde (`cp ... index.html` + git push). Plan boyunca deploy YOK.

**Uygulama dalgaları:** Wave 1 (Task 1–10) = motor + UI + PDF + su bazlı sistemler (sprinkler, pompa, hidrant+dolabı, su deposu, köpük). Wave 2 (Task 11–13) = algılama, gazlı, davlumbaz içerikleri (motor değişmez, yalnız veri eklenir).

**Kod yerleşim çıpaları (grep ile bul, satır no drift eder):**
- A-PRO logo: `grep -n "data:image/svg+xml" APRO_CRM_Firebase.html` (~satır 11).
- Faz 3b bakım fonksiyonları (yanına ekle): `grep -n "function saveMaint\|function computeNextDue\|function _addMonth" APRO_CRM_Firebase.html`.
- PDF deseni referansı: `grep -n "function printPrimBordro" APRO_CRM_Firebase.html`.
- State init: `grep -n "maintenances:\s*\[\]" APRO_CRM_Firebase.html` (state objesi).
- Modal dispatch: `grep -n "type==='maintenance'\|type==='bakim'" APRO_CRM_Firebase.html`.
- Firestore koleksiyon yükleme: `grep -n "'maintenances'" APRO_CRM_Firebase.html`.

---

## Task 1: Test harness (checklist pure fonksiyonları)

Faz 3b harness'ı checklist fonksiyonlarını da çıkarabilecek şekilde yeniden kullanılır; ayrı bir harness gerekmez ama isim listesi genişler. Bu task yalnız ilk test dosyasının iskeletini kurar; asıl testler Task 2–3'te.

**Files:**
- Create: `docs/superpowers/tests/nfpa-freq.test.js`
- Reuse: `docs/superpowers/tests/faz3b-harness.js` (mevcut `load()` isim-bazlı extraction), `docs/superpowers/tests/_assert.js`

- [ ] **Step 1: Doğrulama — harness mevcut fonksiyonu çıkarabiliyor mu**

Run: `cd docs/superpowers/tests && node -e "const{load}=require('./faz3b-harness');console.log(typeof load(['_addMonth']).​_addMonth)"`
Expected: `function` (harness çalışıyor; checklist fonksiyonlarını da aynı yolla çıkaracağız). Not: `_addMonth` HTML'de mevcut (Faz 3b).

- [ ] **Step 2: Commit (henüz test yok, yalnız doğrulama)**

Bu task kod üretmez; Task 2'de ilk test dosyası commit'lenir. Atla.

---

## Task 2: Şablon verisi + `clItems()` accessor (sprinkler içeriği)

Gömülü `CHECKLIST_TEMPLATES` yapısı ve güvenli okuma fonksiyonu. Sprinkler tam içerikle (3 form tipi; bakımda alt-tip + frekans etiketli). Diğer sistemler Task 5,9,10,11–13'te eklenir.

**Veri şekli (sabit):**
```
CHECKLIST_TEMPLATES = {
  ariza:   { <sysKey>: [ {kod, label} , ... ] },
  devreye: { <sysKey>: [ {kod, label} , ... ] },
  bakim:   { <sysKey>: [ {kod, label, freq, sub?} , ... ] }   // freq zorunlu; sub varsa alt-tipe özel
}
```
`freq ∈ {'haftalik','aylik','3aylik','6aylik','yillik','5yillik'}`. `sub ∈ {'islak','kuru','ontepkili'}` (yoksa tüm alt-tiplerde geçerli).

**Files:**
- Modify: `APRO_CRM_Firebase.html` — Faz 3b bakım fonksiyonları bloğundan hemen önce (grep `function computeNextDue`), yeni `// ===== NFPA CHECKLIST =====` bölümü.
- Create/append: `docs/superpowers/tests/nfpa-items.test.js`

- [ ] **Step 1: Failing test yaz**

`docs/superpowers/tests/nfpa-items.test.js`:
```javascript
const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
const { clItems } = load(['CHECKLIST_TEMPLATES','clItems']);

// sprinkler bakım — ıslak alt-tip: genel + islak maddeleri gelir, kuru gelmez
const wet = clItems('bakim','sprinkler','islak');
eq(wet.length>0, true, 'sprinkler/bakim/islak dolu');
eq(wet.every(i=>!i.sub || i.sub==='islak'), true, 'kuru/ontepkili maddeleri sızmaz');
eq(wet.some(i=>i.freq==='yillik'), true, 'yıllık madde var');
// arıza — freq yok, düz liste
eq(clItems('ariza','sprinkler','').length>0, true, 'sprinkler/ariza dolu');
// bilinmeyen sistem → boş dizi (patlamaz)
eq(clItems('bakim','yokolan','') , [], 'bilinmeyen sistem boş dizi');
done();
```

- [ ] **Step 2: Testi çalıştır, fail görsün**

Run: `cd docs/superpowers/tests && node nfpa-items.test.js`
Expected: FAIL — `function not found in HTML: CHECKLIST_TEMPLATES` (henüz yok).

- [ ] **Step 3: `CHECKLIST_TEMPLATES` + `clItems` ekle**

HTML'e (çıpa: `function computeNextDue` üstü) ekle. `clItems`, `bakim`'de alt-tip filtresi uygular (madde `sub` boşsa her alt-tipte; doluysa yalnız eşleşen alt-tipte). Harness `CHECKLIST_TEMPLATES`'i `const`/`function` extraction ile alamaz; bu yüzden **`CHECKLIST_TEMPLATES` bir fonksiyon değil `const`**. Harness yalnız `function NAME(` çıkarır → bu yüzden template'i `clItems` içinden erişilecek şekilde **fonksiyon sarmalayıcıyla** ver: `function _clTemplates(){ return {...}; }` ve `clItems` bunu çağırsın. Testte `load(['_clTemplates','clItems'])` kullan (test import satırını buna göre `_clTemplates` yap).

```javascript
function _clTemplates(){ return {
  ariza: {
    sprinkler: [
      {kod:'spr_a1', label:'Arıza bildirimi/şikâyet konusu teyit edildi'},
      {kod:'spr_a2', label:'İlgili kontrol vanası konumu ve etiketi kontrol edildi'},
      {kod:'spr_a3', label:'Sızıntı/hasarlı başlık veya boru tespiti yapıldı'},
      {kod:'spr_a4', label:'Manometre basınç değerleri okundu ve kaydedildi'},
      {kod:'spr_a5', label:'Arıza giderildi; değişen malzeme kaydedildi'},
      {kod:'spr_a6', label:'Ana drenaj (main drain) testi ile sistem doğrulandı'},
      {kod:'spr_a7', label:'Alarm/akış anahtarı fonksiyonu tekrar test edildi'},
      {kod:'spr_a8', label:'Sistem servise alındı; vanalar açık ve mühürlü'}
    ]
  },
  devreye: {
    sprinkler: [
      {kod:'spr_d1', label:'Malzeme onayları / uygunluk belgeleri kontrol edildi'},
      {kod:'spr_d2', label:'Boru hattı yıkama (flushing) yapıldı'},
      {kod:'spr_d3', label:'Hidrostatik basınç testi (200 psi / 1 saat veya çalışma+50 psi)'},
      {kod:'spr_d4', label:'Askı ve destekler standarda uygun (NFPA 13)'},
      {kod:'spr_d5', label:'Sprinkler tipi/sıcaklık/koruma alanı proje ile uyumlu'},
      {kod:'spr_d6', label:'Kontrol vanaları açık, kilitli/denetim anahtarlı'},
      {kod:'spr_d7', label:'Ana drenaj testi statik ve akış basıncı kaydedildi'},
      {kod:'spr_d8', label:'Su akış alarmı 90 sn içinde çalıştı'},
      {kod:'spr_d9', label:'Yedek sprinkler başlığı ve anahtarı temin edildi'},
      {kod:'spr_d10',label:'İşveren eğitimi verildi; devreye alma tutanağı imzalandı'}
    ]
  },
  bakim: {
    sprinkler: [
      // GENEL (tüm alt-tipler)
      {kod:'spr_m1',  freq:'aylik',   label:'Kontrol vanaları açık konumda, kilitli/denetim anahtarlı'},
      {kod:'spr_m2',  freq:'aylik',   label:'Manometreler iyi durumda, normal basınç gösteriyor'},
      {kod:'spr_m3',  freq:'3aylik',  label:'Su akış alarm cihazları test edildi (inspector test valve)'},
      {kod:'spr_m4',  freq:'3aylik',  label:'Denetim anahtarları (supervisory) test edildi'},
      {kod:'spr_m5',  freq:'3aylik',  label:'Hidrolik bilgi levhası mevcut ve okunur'},
      {kod:'spr_m6',  freq:'yillik',  label:'Sprinkler başlıkları: korozyon/boya/yük/sızıntı yok'},
      {kod:'spr_m7',  freq:'yillik',  label:'Boru ve bağlantılar: hasar/korozyon/kaçak yok, hizada'},
      {kod:'spr_m8',  freq:'yillik',  label:'Askı ve sismik destekler sağlam'},
      {kod:'spr_m9',  freq:'yillik',  label:'Ana drenaj (main drain) tam akış testi yapıldı'},
      {kod:'spr_m10', freq:'yillik',  label:'Yangın pompası/su kaynağı ile bağlantı doğrulandı'},
      {kod:'spr_m11', freq:'5yillik', label:'Boru iç muayenesi (yabancı madde/tıkanma) yapıldı'},
      {kod:'spr_m12', freq:'5yillik', label:'Gate valf iç aksam / basınç azaltma vanası testi'},
      // ISLAK borulu
      {kod:'spr_w1', sub:'islak', freq:'aylik', label:'Islak sistem: ısıtma sağlanıyor, donma riski yok (bina min 4°C)'},
      // KURU borulu
      {kod:'spr_k1', sub:'kuru', freq:'haftalik', label:'Kuru sistem hava/azot basıncı normal aralıkta'},
      {kod:'spr_k2', sub:'kuru', freq:'3aylik',   label:'Kuru vana priming su seviyesi kontrol edildi'},
      {kod:'spr_k3', sub:'kuru', freq:'yillik',   label:'Kuru vana trip testi (kısmi akış) yapıldı'},
      {kod:'spr_k4', sub:'kuru', freq:'yillik',   label:'Düşük nokta drenajları (soğuk hava öncesi) boşaltıldı'},
      // ÖN TEPKİLİ
      {kod:'spr_p1', sub:'ontepkili', freq:'aylik',  label:'Ön tepkili panel gösterge/arıza lambaları normal'},
      {kod:'spr_p2', sub:'ontepkili', freq:'yillik', label:'Deluge/ön tepkili vana full trip testi yapıldı'},
      {kod:'spr_p3', sub:'ontepkili', freq:'yillik', label:'Algılama-vana entegrasyonu (release) test edildi'}
    ]
  }
}; }

function clItems(formType, sysKey, subType){
  var T=_clTemplates()[formType]; if(!T) return [];
  var arr=T[sysKey]; if(!arr) return [];
  if(formType!=='bakim') return arr.map(function(x){return x;});
  return arr.filter(function(i){ return !i.sub || i.sub===subType; });
}
```

- [ ] **Step 4: Test import satırını `_clTemplates` içerecek şekilde güncelle ve çalıştır**

`nfpa-items.test.js` ilk satır: `const { clItems } = load(['_clTemplates','clItems']);`
Run: `cd docs/superpowers/tests && node nfpa-items.test.js`
Expected: `✅ all passed`

- [ ] **Step 5: Syntax**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html docs/superpowers/tests/nfpa-items.test.js
git commit -m "feat(checklist): CHECKLIST_TEMPLATES + clItems accessor (sprinkler)"
```

---

## Task 3: Frekans sırası + `clVisitItems()` filtre + `clComputeNextDue()`

`bakim` formunda ziyaret frekansı seçilince "bu ziyarette yapılacaklar" = seçilen frekans **ve daha sık** olan maddeler. Sonraki vade hesabı Faz 3b `_addMonth` desenini kullanır.

**Frekans sırası (sık→seyrek):** `haftalik(0) < aylik(1) < 3aylik(2) < 6aylik(3) < yillik(4) < 5yillik(5)`. Ziyaret frekansı `F` seçilince `freqRank(item.freq) <= freqRank(F)` olan maddeler gösterilir.

**Files:**
- Modify: `APRO_CRM_Firebase.html` (Task 2 bölümünün devamı)
- Create: `docs/superpowers/tests/nfpa-freq.test.js` (Task 1 iskeleti üzerine)

- [ ] **Step 1: Failing test yaz**

`docs/superpowers/tests/nfpa-freq.test.js`:
```javascript
const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
// NOT: 'haftalik' dalı gün-yardımcısını çağırır. load() listesine HTML'de MEVCUT olanı ekle
// (grep -n "function _addDay\|function _offsetDay" APRO_CRM_Firebase.html) — biri yoksa harness "function not found" atar, ikisini birden listeleme.
const { clVisitItems, clComputeNextDue } = load(['_clTemplates','clItems','clFreqRank','clVisitItems','_addMonth','_addDay','clComputeNextDue']);

const sys = {sysKey:'sprinkler', subType:'islak', visitFreq:'yillik'};
const yr = clVisitItems(sys);
eq(yr.some(i=>i.freq==='aylik'), true, 'yıllık ziyaret aylık maddeleri de içerir');
eq(yr.some(i=>i.freq==='5yillik'), false, '5-yıllık madde yıllık ziyarette görünmez');

const mo = clVisitItems({sysKey:'sprinkler',subType:'islak',visitFreq:'aylik'});
eq(mo.every(i=>['haftalik','aylik'].includes(i.freq)), true, 'aylık ziyaret yalnız haftalık+aylık');

eq(clComputeNextDue('2026-01-15','aylik'),  '2026-02-15', 'sonraki vade aylık');
eq(clComputeNextDue('2026-01-15','6aylik'), '2026-07-15', 'sonraki vade 6 aylık');
eq(clComputeNextDue('2026-01-15','yillik'), '2027-01-15', 'sonraki vade yıllık');
eq(clComputeNextDue('2026-01-15','haftalik'),'2026-01-22','sonraki vade haftalık');
eq(clComputeNextDue('','aylik'), '', 'baz yok → boş');
done();
```

- [ ] **Step 2: Testi çalıştır, fail görsün**

Run: `cd docs/superpowers/tests && node nfpa-freq.test.js`
Expected: FAIL — `function not found in HTML: clFreqRank`.

- [ ] **Step 3: Fonksiyonları ekle**

```javascript
function clFreqRank(f){ return ({haftalik:0,aylik:1,'3aylik':2,'6aylik':3,yillik:4,'5yillik':5})[f]; }
function clVisitItems(system){
  var items=clItems('bakim', system.sysKey, system.subType||'');
  var vf=system.visitFreq; if(vf===undefined||vf==='') return items;
  var vr=clFreqRank(vf); if(vr===undefined) return items;
  return items.filter(function(i){ var r=clFreqRank(i.freq); return r!==undefined && r<=vr; });
}
function clComputeNextDue(baseISO, visitFreq){
  if(!baseISO) return '';
  if(visitFreq==='haftalik') return (typeof _addDay==='function'?_addDay(baseISO,7):_offsetDay(baseISO,7));
  var m=({aylik:1,'3aylik':3,'6aylik':6,yillik:12})[visitFreq];
  if(!m) return '';
  return _addMonth(baseISO, m);
}
```
Not: `_addDay` yoksa Faz 3b'de `_offsetDay` var (grep ile doğrula: `grep -n "function _offsetDay\|function _addDay" APRO_CRM_Firebase.html`); mevcut olanı kullan.

- [ ] **Step 4: Test geç**

Run: `cd docs/superpowers/tests && node nfpa-freq.test.js`
Expected: `✅ all passed`

- [ ] **Step 5: Syntax + Commit**

```bash
bash docs/superpowers/tests/syntax.sh   # ✅ SYNTAX OK
git add APRO_CRM_Firebase.html docs/superpowers/tests/nfpa-freq.test.js
git commit -m "feat(checklist): clVisitItems frekans filtresi + clComputeNextDue"
```

---

## Task 4: Kayıt defaultları + `clSave`/`clDelete` + state + Firestore yükleme

`checklists` koleksiyonu: state'e ekle, Firestore'dan yükle, kaydet/sil. Faz 3b `saveMaint` deseni birebir.

**Files:**
- Modify: `APRO_CRM_Firebase.html` — state init (grep `maintenances: []`), Firestore yükleme (grep `'maintenances'`), fonksiyon bölümü.
- Create: `docs/superpowers/tests/nfpa-normalize.test.js`

- [ ] **Step 1: Failing test — normalize default'ları**

`docs/superpowers/tests/nfpa-normalize.test.js`:
```javascript
const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
// NOT: normChecklist createdAt default'u today() çağırır; today harness DEPS'inde HAZIR tanımlı,
// load listesine EKLEME (aksi halde çift tanım hatası).
const { normChecklist } = load(['normChecklist']);
const n = normChecklist({ id:'x', customerId:'c1' });
eq(n.formType, 'bakim', 'formType default bakim');
eq(Array.isArray(n.systems), true, 'systems dizi');
eq(n.siteName, '', 'siteName default boş');
eq(n.status, 'taslak', 'status default taslak');
eq(n.staffSign && typeof n.staffSign, 'object', 'staffSign obje');
eq(n.custSign.name, '', 'custSign.name boş');
done();
```

- [ ] **Step 2: Fail gör**

Run: `cd docs/superpowers/tests && node nfpa-normalize.test.js`
Expected: FAIL — `function not found in HTML: normChecklist`.

- [ ] **Step 3: `normChecklist` + `clSave` + `clDelete` ekle**

```javascript
function normChecklist(c){
  c=c||{};
  return Object.assign({
    id:c.id, formType:'bakim', customerId:'', siteName:'', projectId:'',
    linkType:'', linkId:'', systems:[],
    staffSign:{name:'',dataURL:'',at:''}, custSign:{name:'',dataURL:'',at:''},
    status:'taslak', createdAt:(c.createdAt||today())
  }, c, {
    systems: Array.isArray(c.systems)? c.systems : [],
    staffSign: Object.assign({name:'',dataURL:'',at:''}, c.staffSign||{}),
    custSign: Object.assign({name:'',dataURL:'',at:''}, c.custSign||{})
  });
}
async function clSave(c){
  c._editedBy=(state.currentUser&&state.currentUser.name)||'';
  c._editedAt=today();
  await saveDoc('checklists', c.id, c);
  var list=(state.checklists||[]).slice();
  var i=list.findIndex(function(x){return x.id===c.id;});
  if(i>=0) list[i]=c; else list.push(c);
  setState({checklists:list});
}
async function clDelete(id){
  if(!confirm('Bu checklist kalıcı olarak silinsin mi?')) return;
  await deleteDoc('checklists', id);
  setState({checklists:(state.checklists||[]).filter(function(x){return x.id!==id;}), modal:null});
  showToast('🗑 Checklist silindi');
}
```
Not: `saveDoc`/`deleteDoc`/`showToast`/`today`/`state.currentUser` mevcut (grep ile alan adını doğrula: `grep -n "state.currentUser\|currentUser:" APRO_CRM_Firebase.html`; farklıysa uyarlanır).

- [ ] **Step 4: State + Firestore yükleme ekle**

State init'e `checklists: [],` ekle (maintenances yanına). Firestore yükleme bloğunda `maintenances` nasıl çekiliyorsa `checklists` için aynısını ekle (grep `'maintenances'` çıktısındaki her ilgili yükleme/subscribe satırını yansıt).

- [ ] **Step 5: Test + syntax + commit**

```bash
cd docs/superpowers/tests && node nfpa-normalize.test.js   # ✅ all passed
cd ../../.. && bash docs/superpowers/tests/syntax.sh          # ✅ SYNTAX OK
git add APRO_CRM_Firebase.html docs/superpowers/tests/nfpa-normalize.test.js
git commit -m "feat(checklist): checklists koleksiyonu, normChecklist, clSave/clDelete, state+load"
```

---

## Task 5: Doldurma ekranı — çatı + sistem ekle (içerik: sprinkler)

Tam ekran mobil-uyumlu doldurma görünümü: başlık (müşteri + saha adı + formType), sistem ekleme (dropdown → alt-tip + `bakim`'de visitFreq), sistem başına tik tablosu + ek not. İmza Task 7, PDF Task 8, giriş butonları Task 9'da.

**Files:**
- Modify: `APRO_CRM_Firebase.html` — render fonksiyonları bölgesi; modal dispatch (grep `type==='bakim'`).

- [ ] **Step 1: `SYS_META` + `openChecklist` state açıcı ekle**

```javascript
const SYS_META = {
  sprinkler:    {l:'Sprinkler', subs:[['islak','Islak borulu'],['kuru','Kuru borulu'],['ontepkili','Ön tepkili']]},
  pompa:        {l:'Yangın Pompası', subs:[]},
  hidrant_dolap:{l:'Hidrant + Yangın Dolabı', subs:[]},
  su_deposu:    {l:'Su Deposu', subs:[]},
  kopuk:        {l:'Köpüklü Söndürme', subs:[]},
  algilama:     {l:'Yangın Algılama & Alarm', subs:[]},
  gazli:        {l:'Gazlı Söndürme', subs:[]},
  davlumbaz:    {l:'Davlumbaz / Mutfak Söndürme', subs:[]}
};
const FREQ_META = {haftalik:'Haftalık',aylik:'Aylık','3aylik':'3 Aylık','6aylik':'6 Aylık',yillik:'Yıllık','5yillik':'5 Yıllık'};
const FORMTYPE_META = {ariza:'Arıza / Servis Formu', devreye:'Test / Devreye Alma Formu', bakim:'Periyodik Bakım Formu'};

function openChecklist(opts){ // {formType, customerId, siteName?, projectId?, linkType?, linkId?, existing?}
  var c = opts.existing ? normChecklist(opts.existing)
        : normChecklist({ id:genId(), formType:opts.formType, customerId:opts.customerId,
            siteName:opts.siteName||'', projectId:opts.projectId||'',
            linkType:opts.linkType||'', linkId:opts.linkId||'' });
  setState({ modal:{ type:'checklist', item:c } });
}
```
Not: `genId` mevcut.

- [ ] **Step 2: Modal dispatch'e `checklist` dalı ekle**

Modal render dispatch'inde (grep `type==='bakim'` bulunan yer) ekle:
```javascript
else if(m.type==='checklist') return buildChecklistModal(m.item);
```

- [ ] **Step 3: `buildChecklistModal` — çatı + sistem ekle + tik tablosu**

`h()` ile mobil uyumlu (satırlar `row()`), tam ekran modal. Her sistem kartı: başlık + (varsa) alt-tip select + (`bakim`) visitFreq select + madde tablosu (her madde: label, `bakim`'de frekans rozeti, 3 durum tik butonu ✔/✗/N-A, not input) + ek not textarea + "Sistemi çıkar". Alt-tip veya visitFreq değişince o sistemin `items` listesi yeniden yüklenir.

```javascript
function clLoadItems(sys, formType){
  var raw = formType==='bakim' ? clVisitItems(sys) : clItems(formType, sys.sysKey, sys.subType||'');
  sys.items = raw.map(function(t){
    var prev=(sys.items||[]).find(function(x){return x.kod===t.kod;});
    return {kod:t.kod, label:t.label, freq:t.freq||'', result:prev?prev.result:'', note:prev?prev.note:''};
  });
}
function clAddSystem(c){
  var sysKey = prompt('Sistem kodu ekle:\n'+Object.keys(SYS_META).map(function(k){return k+' = '+SYS_META[k].l;}).join('\n'));
  if(!sysKey || !SYS_META[sysKey]) return;
  var sys={sysKey:sysKey, subType:'', visitFreq:'', nextDue:'', items:[], extraNotes:''};
  clLoadItems(sys, c.formType);
  c.systems.push(sys); setState({modal:{type:'checklist',item:c}});
}
function buildChecklistModal(c){
  var body=[];
  body.push(h('div',{style:{fontWeight:'700',fontSize:'16px',marginBottom:'8px'}}, FORMTYPE_META[c.formType]||'Checklist'));
  // müşteri + saha
  var cust=(state.customers||[]).find(function(x){return x.id===c.customerId;});
  body.push(field('Müşteri', h('div',{style:{padding:'6px 0'}}, cust?cust.name:'—')));
  body.push(field('Saha / Bina adı', h('input',{value:c.siteName, oninput:function(e){c.siteName=e.target.value;}, style:inputStyle()})));
  // sistemler
  c.systems.forEach(function(sys, si){ body.push(clSystemCard(c, sys, si)); });
  body.push(btn('+ Sistem ekle', function(){clAddSystem(c);}, '#eef2ff','#4338ca','8px 14px'));
  // imza alanı Task 7'de eklenecek — şimdilik yer tutucu yok; kaydet butonu:
  body.push(h('div',{style:{marginTop:'12px'}},
    btn('💾 Kaydet', async function(){ c.status='tamam'; await clSave(c); setState({modal:null}); showToast('✅ Checklist kaydedildi'); }, '#16a34a','#fff','9px 16px')
  ));
  return modal(FORMTYPE_META[c.formType]||'Checklist', body, function(){setState({modal:null});}, '860px');
}
function clSystemCard(c, sys, si){
  var meta=SYS_META[sys.sysKey]||{l:sys.sysKey,subs:[]};
  var rows=[ h('div',{style:{fontWeight:'700',fontSize:'14px'}}, meta.l) ];
  // alt-tip
  if(meta.subs.length){
    rows.push(field('Alt tip', selectEl(meta.subs, sys.subType, function(v){ sys.subType=v; clLoadItems(sys,c.formType); setState({modal:{type:'checklist',item:c}}); })));
  }
  // visitFreq (yalnız bakim)
  if(c.formType==='bakim'){
    var freqOpts=[['haftalik','Haftalık'],['aylik','Aylık'],['3aylik','3 Aylık'],['6aylik','6 Aylık'],['yillik','Yıllık'],['5yillik','5 Yıllık']];
    rows.push(field('Ziyaret frekansı', selectEl(freqOpts, sys.visitFreq, function(v){ sys.visitFreq=v; sys.nextDue=clComputeNextDue(today(),v); clLoadItems(sys,c.formType); setState({modal:{type:'checklist',item:c}}); })));
    if(sys.nextDue) rows.push(h('div',{style:{fontSize:'12px',color:'#0891b2'}}, 'Sonraki bakım vadesi: '+_toTR(sys.nextDue)));
  }
  // maddeler
  sys.items.forEach(function(it){
    rows.push(clItemRow(c, it));
  });
  // ek not
  rows.push(field('Ek maddeler / saha notu', h('textarea',{value:sys.extraNotes, oninput:function(e){sys.extraNotes=e.target.value;}, style:Object.assign(inputStyle(),{minHeight:'48px'})})));
  rows.push(btn('Sistemi çıkar', function(){ c.systems.splice(si,1); setState({modal:{type:'checklist',item:c}}); }, '#fef2f2','#dc2626','5px 10px',{fontSize:'12px'}));
  return h('div',{style:{border:'1px solid #e2e8f0',borderRadius:'10px',padding:'10px',margin:'10px 0'}}, ...rows);
}
function clItemRow(c, it){
  function tik(val,label,bg,fg){ return btn(label, function(){ it.result=val; setState({modal:{type:'checklist',item:c}}); }, it.result===val?bg:'#f1f5f9', it.result===val?fg:'#64748b','4px 9px',{fontSize:'12px'}); }
  var left=[ h('span',{style:{fontSize:'13px'}}, it.label) ];
  if(it.freq) left.push(h('span',{style:{fontSize:'11px',color:'#94a3b8',marginLeft:'6px'}}, '['+ (FREQ_META[it.freq]||it.freq) +']'));
  return h('div',{style:{borderTop:'1px solid #f1f5f9',padding:'6px 0'}},
    h('div',{}, ...left),
    row( tik('uygun','✔ Uygun','#dcfce7','#166534'), tik('uygundegil','✗ Uygun Değil','#fee2e2','#991b1b'), tik('na','N/A','#e2e8f0','#475569'),
      h('input',{value:it.note, placeholder:'Not', oninput:function(e){it.note=e.target.value;}, style:Object.assign(inputStyle(),{flex:'1',minWidth:'120px'})}) )
  );
}
```
Yardımcılar (yoksa ekle): `inputStyle()` küçük stil helper; `selectEl(opts,val,onchange)` → `<select>` (opts `[value,label]` çiftleri). Mevcut benzer helper varsa (grep `function field\|function selectEl`) onu kullan; yoksa bu iki küçük helper'ı ekle:
```javascript
function inputStyle(){ return {padding:'7px 9px',border:'1px solid #cbd5e1',borderRadius:'7px',fontSize:'13px',width:'100%',boxSizing:'border-box'}; }
function selectEl(opts, val, onch){ return h('select',{onchange:function(e){onch(e.target.value);}, style:inputStyle()}, h('option',{value:''},'— seç —'), ...opts.map(function(o){ return h('option',{value:o[0], selected: val===o[0]}, o[1]); })); }
```

- [ ] **Step 4: Syntax**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 5: Manuel doğrulama (tarayıcı)**

`APRO_CRM_Firebase.html` aç → konsoldan geçici tetikle: `openChecklist({formType:'bakim', customerId:(state.customers[0]||{}).id})` → modal açılır → "+ Sistem ekle" → `sprinkler` → alt-tip `islak` + ziyaret frekansı `yillik` → aylık+yıllık maddeler listelenir, 5-yıllık görünmez → tik çalışır → "Sonraki bakım vadesi" görünür.

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(checklist): doldurma ekranı (sistem ekle, alt-tip, frekans filtre, tik)"
```

---

## Task 6: (rezerve — Task 5 ile birleşti)

Task 5 sistem kartı + tik tablosunu kapsadı. Ayrı task gerekmiyor; numarayı atla, sıradaki imza.

---

## Task 7: İmza yakalama (`<canvas>` — personel + müşteri)

Doldurma modalının sonuna iki imza kutusu: personel ve müşteri. Parmak/kalemle çizim (touch + mouse). `toDataURL()` → `staffSign.dataURL` / `custSign.dataURL`. Ad + tarih. Islak imza her zaman PDF'te ayrı satır olarak da durur (Task 8).

**Files:**
- Modify: `APRO_CRM_Firebase.html` — `buildChecklistModal` (imza bölümü + kaydet öncesi), yeni `clSignPad` helper.

- [ ] **Step 1: `clSignPad` çizim helper'ı ekle**

`h()` DOM'a canvas basıp, mount sonrası pointer olaylarını bağlar. `h()` element döndürdüğü için canvas ref'ini closure ile alırız; olayları `setTimeout(...,0)` içinde bağla (DOM'a eklendikten sonra).
```javascript
function clSignPad(sign, label){
  var cv=h('canvas',{width:320, height:120, style:{border:'1px solid #cbd5e1',borderRadius:'8px',touchAction:'none',background:'#fff',maxWidth:'100%'}});
  setTimeout(function(){
    var ctx=cv.getContext('2d'); ctx.lineWidth=2; ctx.lineCap='round'; ctx.strokeStyle='#111';
    if(sign.dataURL){ var img=new Image(); img.onload=function(){ctx.drawImage(img,0,0);}; img.src=sign.dataURL; }
    var drawing=false;
    function pos(e){ var r=cv.getBoundingClientRect(); var t=e.touches?e.touches[0]:e; return {x:(t.clientX-r.left)*(cv.width/r.width), y:(t.clientY-r.top)*(cv.height/r.height)}; }
    function down(e){ drawing=true; var p=pos(e); ctx.beginPath(); ctx.moveTo(p.x,p.y); e.preventDefault(); }
    function move(e){ if(!drawing)return; var p=pos(e); ctx.lineTo(p.x,p.y); ctx.stroke(); e.preventDefault(); }
    function up(){ if(drawing){ drawing=false; sign.dataURL=cv.toDataURL('image/png'); sign.at=today(); } }
    cv.addEventListener('mousedown',down); cv.addEventListener('mousemove',move); window.addEventListener('mouseup',up);
    cv.addEventListener('touchstart',down); cv.addEventListener('touchmove',move); cv.addEventListener('touchend',up);
  },0);
  var clearBtn=btn('Temizle', function(){ var ctx=cv.getContext('2d'); ctx.clearRect(0,0,cv.width,cv.height); sign.dataURL=''; sign.at=''; }, '#f1f5f9','#475569','4px 10px',{fontSize:'12px'});
  return h('div',{style:{margin:'6px 0'}},
    h('div',{style:{fontSize:'13px',fontWeight:'600',marginBottom:'4px'}}, label),
    h('input',{value:sign.name, placeholder:'Ad Soyad', oninput:function(e){sign.name=e.target.value;}, style:inputStyle()}),
    cv, clearBtn
  );
}
```

- [ ] **Step 2: `buildChecklistModal`'a imza bölümünü ekle**

Kaydet butonundan ÖNCE (Task 5'teki `body.push(h('div'...Kaydet...))` satırının üstüne):
```javascript
body.push(h('div',{style:{marginTop:'14px',fontWeight:'700'}}, 'İmzalar'));
body.push(row( clSignPad(c.staffSign,'A-Pro Yetkilisi'), clSignPad(c.custSign,'Müşteri Yetkilisi') ));
```

- [ ] **Step 3: Syntax**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 4: Manuel doğrulama**

Modal aç → alt tarafta iki imza kutusu → fare/dokunuşla çiz → `Temizle` çalışır → Kaydet → tekrar aç (Düzenle) → imza görseli geri yüklenir (Image draw).

- [ ] **Step 5: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(checklist): canvas ile personel+müşteri imza yakalama"
```

---

## Task 8: A-PRO logolu A4 PDF çıktısı (`printChecklist`)

`printPrimBordro`/`print-overlay` desenini kullanarak tam ekran çıktı: A-PRO logo + başlık + müşteri/saha/tarih/formType → her sistem bölümü (tik tablosu) → tek imza bloğu (dijital görsel + ıslak imza satırları). `window.print()`.

**Files:**
- Modify: `APRO_CRM_Firebase.html` — yeni `printChecklist(c)` (çıpa: `function printPrimBordro` yanına). Logo çıpası: grep `data:image/svg+xml`.

- [ ] **Step 1: `printChecklist` ekle**

`escapeHtml` mevcut (grep `function escapeHtml`). Logo: mevcut gömülü SVG data-URI'yi bir sabitten al veya HTML'deki logo `<img src>`ini yeniden kullan. Sonuç HTML string'i `print-overlay` div'ine yazılır.
```javascript
function _clResultBadge(r){ return r==='uygun'?'✔ Uygun': r==='uygundegil'?'✗ Uygun Değil': r==='na'?'N/A':'—'; }
function printChecklist(c){
  c=normChecklist(c);
  var cust=(state.customers||[]).find(function(x){return x.id===c.customerId;});
  var LOGO='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="140" height="40"><text x="0" y="28" font-size="26" font-weight="700" fill="#1d4ed8">A-PRO</text></svg>');
  // NOT: mevcut gömülü logoyu kullan — grep "data:image/svg+xml" ile HTML'deki logoyu al ve LOGO'ya koy.
  var sysHtml=c.systems.map(function(sys){
    var meta=SYS_META[sys.sysKey]||{l:sys.sysKey};
    var head=escapeHtml(meta.l)+(sys.subType?(' · '+escapeHtml(sys.subType)):'')+(c.formType==='bakim'&&sys.visitFreq?(' · '+escapeHtml(FREQ_META[sys.visitFreq]||sys.visitFreq)):'');
    var due=(c.formType==='bakim'&&sys.nextDue)?('<div class="due">Sonraki bakım vadesi: '+escapeHtml(_toTR(sys.nextDue))+'</div>'):'';
    var rows=(sys.items||[]).map(function(it){
      return '<tr><td>'+escapeHtml(it.label)+'</td><td class="c">'+(it.freq?escapeHtml(FREQ_META[it.freq]||it.freq):'')+'</td><td class="c">'+_clResultBadge(it.result)+'</td><td>'+escapeHtml(it.note||'')+'</td></tr>';
    }).join('');
    var extra=sys.extraNotes?('<div class="extra"><b>Ek not:</b> '+escapeHtml(sys.extraNotes)+'</div>'):'';
    return '<div class="sys"><h3>'+head+'</h3>'+due+'<table><thead><tr><th>Madde</th><th class="c">Frekans</th><th class="c">Sonuç</th><th>Not</th></tr></thead><tbody>'+rows+'</tbody></table>'+extra+'</div>';
  }).join('');
  function signBox(s,role){
    var img=s.dataURL?('<img src="'+s.dataURL+'" class="sig"/>'):'<div class="sig"></div>';
    return '<div class="signbox"><div class="role">'+role+'</div>'+img+'<div class="sigline">Ad Soyad: '+escapeHtml(s.name||'')+'</div><div class="sigline">Tarih: '+escapeHtml(s.at?_toTR(s.at):'')+'</div><div class="sigline">İmza (ıslak): ______________________</div></div>';
  }
  var html=''
   +'<style>@media print{.no-print{display:none!important;}} body{font-family:Arial,sans-serif;color:#111;} .hd{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1d4ed8;padding-bottom:8px;margin-bottom:12px;} .hd h1{font-size:18px;margin:0;} .meta{font-size:12px;color:#334155;margin-bottom:12px;} .sys{margin:14px 0;page-break-inside:avoid;} .sys h3{font-size:14px;background:#eff6ff;padding:6px 8px;border-radius:6px;margin:0 0 6px;} table{width:100%;border-collapse:collapse;font-size:12px;} th,td{border:1px solid #e2e8f0;padding:5px 7px;text-align:left;vertical-align:top;} th{background:#f8fafc;} td.c,th.c{text-align:center;white-space:nowrap;} .due{font-size:12px;color:#0891b2;margin:2px 0 6px;} .extra{font-size:12px;margin:4px 0;} .signs{display:flex;gap:24px;margin-top:24px;page-break-inside:avoid;} .signbox{flex:1;} .role{font-weight:700;font-size:13px;margin-bottom:4px;} img.sig,.sig{display:block;width:220px;height:80px;border:1px solid #cbd5e1;border-radius:6px;object-fit:contain;} .sigline{font-size:12px;margin-top:4px;}</style>'
   +'<div class="hd"><img src="'+LOGO+'" height="40"/><h1>'+escapeHtml(FORMTYPE_META[c.formType]||'Checklist')+'</h1></div>'
   +'<div class="meta"><b>Müşteri:</b> '+escapeHtml(cust?cust.name:'—')+' &nbsp; <b>Saha/Bina:</b> '+escapeHtml(c.siteName||'—')+' &nbsp; <b>Tarih:</b> '+escapeHtml(_toTR(c.createdAt||today()))+'</div>'
   +sysHtml
   +'<div class="signs">'+signBox(c.staffSign,'A-Pro Yetkilisi')+signBox(c.custSign,'Müşteri Yetkilisi')+'</div>';
  var ep=document.getElementById('print-overlay'); if(ep) ep.remove();
  var po=document.createElement('div'); po.id='print-overlay'; po.style.cssText='position:fixed;inset:0;z-index:99999;background:#fff;display:flex;flex-direction:column;';
  var bar=document.createElement('div'); bar.className='no-print'; bar.style.cssText='display:flex;gap:8px;padding:10px;border-bottom:1px solid #e2e8f0;';
  var pb=document.createElement('button'); pb.textContent='🖨️ Yazdır'; pb.style.cssText='padding:8px 18px;background:linear-gradient(135deg,#16a34a,#15803d);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;'; pb.onclick=function(){window.print();};
  var cb=document.createElement('button'); cb.textContent='✕ Kapat'; cb.style.cssText='padding:8px 18px;background:#dc2626;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;'; cb.onclick=function(){po.remove();};
  bar.appendChild(pb); bar.appendChild(cb);
  var content=document.createElement('div'); content.style.cssText='overflow:auto;padding:24px;'; content.innerHTML=html;
  po.appendChild(bar); po.appendChild(content); document.body.appendChild(po);
}
```
**ÖNEMLİ:** `LOGO` sabitini, HTML'de satır ~11'deki gerçek gömülü A-PRO SVG data-URI ile değiştir (grep `data:image/svg+xml`); yukarıdaki basit SVG yalnız yer tutucudur — gerçek logo kullanılmalı.

- [ ] **Step 2: Syntax**

Run: `bash docs/superpowers/tests/syntax.sh`
Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Manuel doğrulama**

Doldurulmuş checklist üzerinden konsol: `printChecklist(state.checklists[0])` → A-PRO logolu A4 → sistem tabloları, sonuç rozetleri, dijital imza görseli + ıslak imza satırları → 🖨️ Yazdır PDF önizleme.

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(checklist): A-PRO logolu A4 PDF çıktısı (printChecklist)"
```

---

## Task 9: Giriş noktaları + checklist listesi (servis / bakım / proje-müşteri)

Butonlar ve kayıt-içi liste: aç/düzenle/PDF/sil.

**Files:**
- Modify: `APRO_CRM_Firebase.html` — `buildArizaModal` (servis), `buildBakimModal`/bakım kartı, `buildProjeModal` (proje). Çıpalar: grep `function buildArizaModal`, `function buildBakimModal`, `function buildProjeModal`.

- [ ] **Step 1: `clListFor` helper — bir kayda bağlı checklist listesi**

```javascript
function clListFor(linkType, linkId){ return (state.checklists||[]).filter(function(c){return c.linkType===linkType && c.linkId===linkId;}); }
function clListBlock(c_linkType, linkId, customerId, formType, siteName, projectId){
  var items=clListFor(c_linkType, linkId);
  var rows=items.map(function(c){
    return row(
      h('span',{style:{flex:'1',fontSize:'13px'}}, (FORMTYPE_META[c.formType]||c.formType)+' · '+_toTR(c.createdAt)+' · '+(c.status==='tamam'?'✅':'✏️')),
      btn('PDF', function(){printChecklist(c);}, '#eff6ff','#1d4ed8','4px 10px',{fontSize:'12px'}),
      btn('Düzenle', function(){openChecklist({existing:c});}, '#f1f5f9','#475569','4px 10px',{fontSize:'12px'}),
      btn('Sil', function(){clDelete(c.id);}, '#fef2f2','#dc2626','4px 10px',{fontSize:'12px'})
    );
  });
  return h('div',{style:{margin:'10px 0'}},
    h('div',{style:{fontWeight:'700',fontSize:'13px',marginBottom:'4px'}}, '📋 Checklist&#39;ler'),
    ...(rows.length?rows:[h('div',{style:{fontSize:'12px',color:'#94a3b8'}},'Henüz checklist yok.')]),
    btn('+ Yeni Checklist', function(){ openChecklist({formType:formType, customerId:customerId, siteName:siteName||'', projectId:projectId||'', linkType:c_linkType, linkId:linkId}); }, '#ecfdf5','#065f46','6px 12px',{fontSize:'12px',marginTop:'6px'})
  );
}
```

- [ ] **Step 2: Servis (arıza) modalına ekle**

`buildArizaModal(s)` içeriğine (aksiyon barından sonra) ekle:
```javascript
content.push(clListBlock('service', s.id, s.customerId, 'ariza', s.siteName||''));
```
Not: servis kaydının müşteri alan adını grep ile doğrula (`s.customerId`).

- [ ] **Step 3: Bakım modalına ekle**

`buildBakimModal(m)` (veya bakım kartı modalı) içine:
```javascript
content.push(clListBlock('maintenance', m.id, m.customerId, 'bakim', m.siteName||''));
```

- [ ] **Step 4: Proje modalına devreye alma butonu ekle**

`buildProjeModal(o)` aksiyon barına:
```javascript
acts.push(btn('🧪 Devreye Alma Checklist', function(){ openChecklist({formType:'devreye', customerId:o.customerId, projectId:o.id, siteName:o.siteName||''}); }, '#eef2ff','#4338ca','8px 14px',{fontSize:'13px'}));
```
Proje bağlı checklist listesini de göstermek için (projectId ile): `clListFor` yerine projectId filtreli küçük varyant kullanılabilir; v1'de buton yeterli (liste bağı `linkType:''` kalır, PDF/düzenleme "Devreye alma" kayıtları müşteri altından da erişilebilir). Basit tutmak için proje modalında yalnız "Yeni" butonu; düzenleme için kayıt Firestore'da durur.

- [ ] **Step 5: Syntax + manuel**

`bash docs/superpowers/tests/syntax.sh` → `✅ SYNTAX OK`. Tarayıcı: Teknik Servis kartı aç → "📋 Checklist&#39;ler" bloğu + "+ Yeni Checklist" → arıza formu açılır, kaydedince listede görünür, PDF/Düzenle/Sil çalışır. Bakım kartında bakım formu. Proje kartında "🧪 Devreye Alma Checklist".

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(checklist): servis/bakım/proje giriş noktaları + kayıt-içi liste"
```

---

## Task 10: İçerik — pompa, hidrant+dolabı, su deposu, köpük (Wave 1 kalan)

Motor değişmez; `_clTemplates()` içine 4 sistemin `ariza`/`devreye`/`bakim` maddeleri eklenir. `bakim` maddeleri `freq` etiketli. Aşağıdaki listeler NFPA 25 (pompa NFPA 20/25) temelli v1 taslağıdır; kullanıcı canlı NFPA sürümüne göre gözden geçirir.

**Files:**
- Modify: `APRO_CRM_Firebase.html` — `_clTemplates()` (her formType altına ilgili sysKey).
- Modify: `docs/superpowers/tests/nfpa-items.test.js` — 4 sistem için "dolu liste" assert'leri.

- [ ] **Step 1: Test genişlet (fail)**

`nfpa-items.test.js` sonuna (done'dan önce):
```javascript
['pompa','hidrant_dolap','su_deposu','kopuk'].forEach(function(sk){
  eq(clItems('bakim',sk,'').length>0, true, sk+' bakim dolu');
  eq(clItems('devreye',sk,'').length>0, true, sk+' devreye dolu');
  eq(clItems('ariza',sk,'').length>0, true, sk+' ariza dolu');
});
```
Run: `node docs/superpowers/tests/nfpa-items.test.js` → FAIL (boş diziler).

- [ ] **Step 2: `_clTemplates()`'e pompa ekle**

`bakim.pompa`:
```javascript
pompa: [
  {kod:'pmp_m1', freq:'haftalik', label:'Pompa dairesi sıcaklık min 4°C (dizel için 21°C) sağlanıyor'},
  {kod:'pmp_m2', freq:'haftalik', label:'Emiş/sistem basıncı normal; yakıt deposu ≥%50 (dizel)'},
  {kod:'pmp_m3', freq:'haftalik', label:'Vanalar (emiş/basma) açık ve kilitli'},
  {kod:'pmp_m4', freq:'haftalik', label:'Akü şarj/gerilim normal, terminaller temiz (dizel)'},
  {kod:'pmp_m5', freq:'haftalik', label:'No-flow (haftalık) çalıştırma testi: dizel 30 dk / elektrik 10 dk'},
  {kod:'pmp_m6', freq:'aylik',    label:'Jokey pompa devreye giriş/çıkış basınçları doğru'},
  {kod:'pmp_m7', freq:'yillik',   label:'Yıllık akış testi (min/rated/peak %150) — performans eğrisi'},
  {kod:'pmp_m8', freq:'yillik',   label:'Salmastra/mekanik conta damlaması uygun, rulman/hizalama kontrol'},
  {kod:'pmp_m9', freq:'yillik',   label:'Emniyet valfi ve devir sayısı (rpm) kontrol edildi'}
]
```
`devreye.pompa`:
```javascript
pompa: [
  {kod:'pmp_d1', label:'Pompa/motor plaka değerleri proje ile uyumlu'},
  {kod:'pmp_d2', label:'Emiş hattı, düzeltici fitting ve manometreler standarda uygun'},
  {kod:'pmp_d3', label:'Saha kabul akış testi: 3 nokta (%0/%100/%150) eğrisi çıkarıldı'},
  {kod:'pmp_d4', label:'Otomatik start basınç ayarı ve min çalışma süresi doğrulandı'},
  {kod:'pmp_d5', label:'Dizel: yakıt, egzoz, soğutma, akü ve alarm panosu test edildi'},
  {kod:'pmp_d6', label:'Faz koruma / ATS (elektrik) ve alarm sinyalleri test edildi'},
  {kod:'pmp_d7', label:'Devreye alma tutanağı ve eğitim imzalandı'}
]
```
`ariza.pompa`:
```javascript
pompa: [
  {kod:'pmp_a1', label:'Arıza/alarm nedeni teyit edildi (basınç düşük/çalışmıyor/aşırı ısı)'},
  {kod:'pmp_a2', label:'Elektrik besleme/akü/yakıt durumu kontrol edildi'},
  {kod:'pmp_a3', label:'Emiş-basma vanaları ve çek valf kontrol edildi'},
  {kod:'pmp_a4', label:'Arıza giderildi; değişen parça kaydedildi'},
  {kod:'pmp_a5', label:'Çalıştırma testi ile pompa fonksiyonu doğrulandı'},
  {kod:'pmp_a6', label:'Sistem otomatik moda alındı, alarmlar sıfırlandı'}
]
```

- [ ] **Step 3: `_clTemplates()`'e hidrant_dolap ekle (iki alt-grup, tek liste)**

`bakim.hidrant_dolap`:
```javascript
hidrant_dolap: [
  // Hidrant
  {kod:'hd_m1', freq:'yillik', label:'HİDRANT: gövde/kapak/çıkış ağızları hasarsız, kapaklar takılı'},
  {kod:'hd_m2', freq:'yillik', label:'HİDRANT: yağlama yapıldı, kolayca açılıp kapanıyor, kuru tip drenajı çalışıyor'},
  {kod:'hd_m3', freq:'yillik', label:'HİDRANT: akış testi ile su verdebisi/basıncı doğrulandı'},
  {kod:'hd_m4', freq:'aylik',  label:'HİDRANT: erişim açık, görünür, işaretli; donma koruması mevcut'},
  // Yangın dolabı / standpipe
  {kod:'hd_m5', freq:'aylik',  label:'DOLAP: hortum, lans, vana, makara erişilebilir ve hasarsız'},
  {kod:'hd_m6', freq:'yillik', label:'DOLAP: hortum basınç testi / gözden geçirme yapıldı'},
  {kod:'hd_m7', freq:'yillik', label:'STANDPIPE: itfaiye su alma ağzı kör rekoru ve vana kontrol edildi'},
  {kod:'hd_m8', freq:'5yillik',label:'STANDPIPE: akış testi ve iç hidrostatik kontrol yapıldı'}
]
```
`devreye.hidrant_dolap`:
```javascript
hidrant_dolap: [
  {kod:'hd_d1', label:'Hidrant/dolap yerleşimi ve kapsama mesafeleri projeye uygun'},
  {kod:'hd_d2', label:'Hidrostatik test ve yıkama (flushing) yapıldı'},
  {kod:'hd_d3', label:'Akış testi: statik/artık basınç ve debi kaydedildi'},
  {kod:'hd_d4', label:'Hortum/lans/vana/rekor takımı tam ve standart'},
  {kod:'hd_d5', label:'İşaretleme, erişim ve donma koruması sağlandı; tutanak imzalandı'}
]
```
`ariza.hidrant_dolap`:
```javascript
hidrant_dolap: [
  {kod:'hd_a1', label:'Arıza konusu teyit (kaçak/tıkanık/hasar/basınç yok)'},
  {kod:'hd_a2', label:'İlgili izolasyon vanası konumu belirlendi'},
  {kod:'hd_a3', label:'Onarım/değişim yapıldı; malzeme kaydedildi'},
  {kod:'hd_a4', label:'Akış/sızdırmazlık testi ile doğrulandı'},
  {kod:'hd_a5', label:'Sistem servise alındı, vanalar açık ve işaretli'}
]
```

- [ ] **Step 4: `_clTemplates()`'e su_deposu ekle**

`bakim.su_deposu`:
```javascript
su_deposu: [
  {kod:'sd_m1', freq:'aylik',  label:'Su seviyesi normal; seviye göstergesi/şamandıra çalışıyor'},
  {kod:'sd_m2', freq:'aylik',  label:'Isıtma/donma koruması çalışıyor (soğuk iklim)'},
  {kod:'sd_m3', freq:'3aylik', label:'Düşük su seviyesi alarmı test edildi'},
  {kod:'sd_m4', freq:'yillik', label:'Depo iç/dış korozyon, sızıntı, çökme kontrolü'},
  {kod:'sd_m5', freq:'yillik', label:'Havalandırma, taşma, çıkış filtresi/anti-vorteks kontrol'},
  {kod:'sd_m6', freq:'yillik', label:'Otomatik dolum vanası ve besleme hattı test edildi'},
  {kod:'sd_m7', freq:'5yillik',label:'İç muayene / temizlik (tortu, kaplama) yapıldı'}
]
```
`devreye.su_deposu`:
```javascript
su_deposu: [
  {kod:'sd_d1', label:'Depo hacmi ve rezerv süresi proje/hesap ile uyumlu'},
  {kod:'sd_d2', label:'Sızdırmazlık/dolum testi yapıldı'},
  {kod:'sd_d3', label:'Seviye göstergesi, alarmlar ve otomatik dolum test edildi'},
  {kod:'sd_d4', label:'Anti-vorteks plakası ve çıkış bağlantıları doğru'},
  {kod:'sd_d5', label:'Isıtma/havalandırma/taşma düzeni uygun; tutanak imzalandı'}
]
```
`ariza.su_deposu`:
```javascript
su_deposu: [
  {kod:'sd_a1', label:'Arıza konusu teyit (seviye düşük/dolmuyor/sızıntı/alarm)'},
  {kod:'sd_a2', label:'Dolum vanası, şamandıra ve besleme kontrol edildi'},
  {kod:'sd_a3', label:'Onarım yapıldı; değişen parça kaydedildi'},
  {kod:'sd_a4', label:'Seviye ve alarm fonksiyonu doğrulandı'},
  {kod:'sd_a5', label:'Sistem normal işletmeye alındı'}
]
```

- [ ] **Step 5: `_clTemplates()`'e kopuk ekle**

`bakim.kopuk`:
```javascript
kopuk: [
  {kod:'kp_m1', freq:'aylik',  label:'Köpük konsantre tankı seviyesi ve sızıntı kontrolü'},
  {kod:'kp_m2', freq:'3aylik', label:'Oranlayıcı (proportioner), vana ve boru hattı görsel kontrol'},
  {kod:'kp_m3', freq:'yillik', label:'Köpük konsantre laboratuvar/kalite testi (numune)'},
  {kod:'kp_m4', freq:'yillik', label:'Oranlama (proportioning) testi ile karışım oranı doğrulandı'},
  {kod:'kp_m5', freq:'yillik', label:'Köpük üreteçleri/nozullar tıkanıklık ve fonksiyon kontrolü'},
  {kod:'kp_m6', freq:'yillik', label:'Deluge/köpük vanası trip testi yapıldı'}
]
```
`devreye.kopuk`:
```javascript
kopuk: [
  {kod:'kp_d1', label:'Köpük tipi/oranı ve tasarım debisi projeye uygun'},
  {kod:'kp_d2', label:'Boru yıkama ve hidrostatik test yapıldı'},
  {kod:'kp_d3', label:'Oranlama testi (kabul) ile karışım oranı doğrulandı'},
  {kod:'kp_d4', label:'Deşarj/dağılım testi (gerekiyorsa) gerçekleştirildi'},
  {kod:'kp_d5', label:'Algılama-release entegrasyonu test edildi; tutanak imzalandı'}
]
```
`ariza.kopuk`:
```javascript
kopuk: [
  {kod:'kp_a1', label:'Arıza konusu teyit (deşarj yok/oran hatalı/kaçak)'},
  {kod:'kp_a2', label:'Konsantre seviyesi, oranlayıcı ve vanalar kontrol edildi'},
  {kod:'kp_a3', label:'Onarım/değişim yapıldı; malzeme kaydedildi'},
  {kod:'kp_a4', label:'Fonksiyon/oran testi ile doğrulandı'},
  {kod:'kp_a5', label:'Sistem otomatik moda alındı'}
]
```

- [ ] **Step 6: Test + syntax + commit**

```bash
node docs/superpowers/tests/nfpa-items.test.js   # ✅ all passed
bash docs/superpowers/tests/syntax.sh            # ✅ SYNTAX OK
git add APRO_CRM_Firebase.html docs/superpowers/tests/nfpa-items.test.js
git commit -m "feat(checklist): pompa/hidrant+dolabı/su deposu/köpük içerikleri (Wave 1)"
```

---

## Task 11: İçerik — Yangın algılama & alarm (NFPA 72) [Wave 2]

**Files:** Modify `_clTemplates()` (algilama) + `nfpa-items.test.js`.

- [ ] **Step 1: Test (fail)** — `nfpa-items.test.js`'e `['algilama'].forEach(...)` bloğu (Task 10 Step 1 kalıbı). Run → FAIL.

- [ ] **Step 2: `_clTemplates()`'e algilama ekle**

`bakim.algilama`:
```javascript
algilama: [
  {kod:'alg_m1', freq:'aylik',  label:'Kontrol paneli: besleme/arıza/alarm LED durumları normal'},
  {kod:'alg_m2', freq:'3aylik', label:'Akü gerilimi/şarj ve yedek besleme süresi kontrol'},
  {kod:'alg_m3', freq:'yillik', label:'Tüm dedektörler (duman/ısı) fonksiyon testi'},
  {kod:'alg_m4', freq:'yillik', label:'Butonlar, sirenler, flaşörler test edildi'},
  {kod:'alg_m5', freq:'yillik', label:'Duman dedektörü hassasiyet/kirlilik kontrolü'},
  {kod:'alg_m6', freq:'yillik', label:'İtfaiye/izleme merkezi haberleşme sinyali test edildi'},
  {kod:'alg_m7', freq:'yillik', label:'Entegrasyon (asansör, damper, kapı, söndürme tetik) test edildi'}
]
```
`devreye.algilama`:
```javascript
algilama: [
  {kod:'alg_d1', label:'Cihaz yerleşimi ve adresleme proje ile birebir'},
  {kod:'alg_d2', label:'%100 cihaz fonksiyon testi (kabul) yapıldı'},
  {kod:'alg_d3', label:'Sesli/ışıklı uyarı seviyeleri (dB) ölçüldü'},
  {kod:'alg_d4', label:'Yedek besleme (akü) süre testi yapıldı'},
  {kod:'alg_d5', label:'Tüm entegrasyon senaryoları (cause&effect) doğrulandı'},
  {kod:'alg_d6', label:'As-built ve devreye alma tutanağı imzalandı'}
]
```
`ariza.algilama`:
```javascript
algilama: [
  {kod:'alg_a1', label:'Arıza/alarm kaynağı panelden tespit edildi (zon/adres)'},
  {kod:'alg_a2', label:'İlgili cihaz/kablaj/akü kontrol edildi'},
  {kod:'alg_a3', label:'Onarım/değişim yapıldı; parça kaydedildi'},
  {kod:'alg_a4', label:'Fonksiyon testi ve panel reset ile doğrulandı'},
  {kod:'alg_a5', label:'Sistem tam korumaya alındı; olay kaydı temizlendi'}
]
```

- [ ] **Step 3: Test + syntax + commit**

```bash
node docs/superpowers/tests/nfpa-items.test.js && bash docs/superpowers/tests/syntax.sh
git add APRO_CRM_Firebase.html docs/superpowers/tests/nfpa-items.test.js
git commit -m "feat(checklist): yangın algılama & alarm içerikleri (NFPA 72)"
```

---

## Task 12: İçerik — Gazlı söndürme (NFPA 2001/12) [Wave 2]

**Files:** Modify `_clTemplates()` (gazli) + `nfpa-items.test.js`.

- [ ] **Step 1: Test (fail)** — `['gazli']` bloğu ekle. Run → FAIL.

- [ ] **Step 2: `_clTemplates()`'e gazli ekle**

`bakim.gazli`:
```javascript
gazli: [
  {kod:'gz_m1', freq:'aylik',  label:'Tüp basınç/ağırlık göstergeleri normal aralıkta'},
  {kod:'gz_m2', freq:'aylik',  label:'Panel gösterge/arıza durumu normal; manuel/otomatik seçici doğru'},
  {kod:'gz_m3', freq:'6aylik', label:'Tüp bağlantıları, hortumlar, nozullar ve boru askıları kontrol'},
  {kod:'gz_m4', freq:'yillik', label:'Ağırlık/basınç kaybı ≤ standart limit (aksi halde dolum)'},
  {kod:'gz_m5', freq:'yillik', label:'Algılama-boşaltma senaryosu (test modunda) doğrulandı'},
  {kod:'gz_m6', freq:'yillik', label:'Oda sızdırmazlık (room integrity / fan test) kontrolü'},
  {kod:'gz_m7', freq:'yillik', label:'Uyarı levhaları, geciktirme ve iptal butonları test edildi'}
]
```
`devreye.gazli`:
```javascript
gazli: [
  {kod:'gz_d1', label:'Ajan tipi/miktarı ve tasarım konsantrasyonu projeye uygun'},
  {kod:'gz_d2', label:'Boru/nozul dağılımı ve hesap (flow calc) doğrulandı'},
  {kod:'gz_d3', label:'Room integrity (fan) testi ile tutma süresi sağlandı'},
  {kod:'gz_d4', label:'Algılama-release cause&effect test edildi (boşaltmasız)'},
  {kod:'gz_d5', label:'Manuel boşaltma/iptal ve uyarı cihazları test edildi'},
  {kod:'gz_d6', label:'Devreye alma tutanağı ve eğitim imzalandı'}
]
```
`ariza.gazli`:
```javascript
gazli: [
  {kod:'gz_a1', label:'Arıza/alarm kaynağı teyit (basınç düşük/panel arıza)'},
  {kod:'gz_a2', label:'Tüp basınç/ağırlık ve tetik hattı kontrol edildi'},
  {kod:'gz_a3', label:'Onarım/dolum/değişim yapıldı; kaydedildi'},
  {kod:'gz_a4', label:'Test modunda fonksiyon doğrulandı (boşaltmasız)'},
  {kod:'gz_a5', label:'Sistem otomatik moda alındı; güvenlik kontrolleri yapıldı'}
]
```

- [ ] **Step 3: Test + syntax + commit**

```bash
node docs/superpowers/tests/nfpa-items.test.js && bash docs/superpowers/tests/syntax.sh
git add APRO_CRM_Firebase.html docs/superpowers/tests/nfpa-items.test.js
git commit -m "feat(checklist): gazlı söndürme içerikleri (NFPA 2001/12)"
```

---

## Task 13: İçerik — Davlumbaz / mutfak söndürme (NFPA 96/17A) [Wave 2]

**Files:** Modify `_clTemplates()` (davlumbaz) + `nfpa-items.test.js`.

- [ ] **Step 1: Test (fail)** — `['davlumbaz']` bloğu ekle. Run → FAIL.

- [ ] **Step 2: `_clTemplates()`'e davlumbaz ekle**

`bakim.davlumbaz`:
```javascript
davlumbaz: [
  {kod:'dv_m1', freq:'aylik',  label:'Nozul kapakları takılı, yağ/kir birikimi yok'},
  {kod:'dv_m2', freq:'aylik',  label:'Manuel tetik (pull station) erişilebilir ve işaretli'},
  {kod:'dv_m3', freq:'6aylik', label:'Sistem tam kontrol (17A): tüp basıncı, tetik hattı, füzibl link'},
  {kod:'dv_m4', freq:'6aylik', label:'Füzibl linkler değiştirildi (yıllık/6 aylık — üretici gereği)'},
  {kod:'dv_m5', freq:'6aylik', label:'Gaz/elektrik kesme (shut-off) enterlok testi yapıldı'},
  {kod:'dv_m6', freq:'yillik', label:'Davlumbaz/kanal yağ temizliği (NFPA 96) doğrulandı'}
]
```
`devreye.davlumbaz`:
```javascript
davlumbaz: [
  {kod:'dv_d1', label:'Nozul tipi/sayısı ve koruma alanı (pişirici/kanal) projeye uygun'},
  {kod:'dv_d2', label:'Tüp basıncı ve tetik mekanizması test edildi'},
  {kod:'dv_d3', label:'Gaz/elektrik otomatik kesme enterloku doğrulandı'},
  {kod:'dv_d4', label:'Manuel tetik ve füzibl link fonksiyonu test edildi'},
  {kod:'dv_d5', label:'Davlumbaz/kanal/egzoz düzeni NFPA 96 uyumlu; tutanak imzalandı'}
]
```
`ariza.davlumbaz`:
```javascript
davlumbaz: [
  {kod:'dv_a1', label:'Arıza konusu teyit (tetik/basınç/kesme çalışmıyor)'},
  {kod:'dv_a2', label:'Tüp, tetik hattı, füzibl link ve kesme vanası kontrol'},
  {kod:'dv_a3', label:'Onarım/değişim yapıldı; malzeme kaydedildi'},
  {kod:'dv_a4', label:'Manuel/otomatik tetik fonksiyonu doğrulandı'},
  {kod:'dv_a5', label:'Sistem hazır konuma alındı; ocak/kanal güvenliği kontrol'}
]
```

- [ ] **Step 3: Test + syntax + commit**

```bash
node docs/superpowers/tests/nfpa-items.test.js && bash docs/superpowers/tests/syntax.sh
git add APRO_CRM_Firebase.html docs/superpowers/tests/nfpa-items.test.js
git commit -m "feat(checklist): davlumbaz/mutfak söndürme içerikleri (NFPA 96/17A)"
```

---

## Nihai Doğrulama (tüm task'lar sonrası)

- Tüm testler: `for f in docs/superpowers/tests/nfpa-*.test.js; do node "$f" || break; done` → hepsi `✅ all passed`.
- `bash docs/superpowers/tests/syntax.sh` → `✅ SYNTAX OK`.
- Manuel uçtan uca: her giriş noktası (servis/bakım/proje) → 8 sistemin her biri için doldur → alt-tip/frekans → tik + N/A + ek not → çift imza → kaydet (Firestore) → PDF (A-PRO logo, imza blokları, ıslak imza satırları) → düzenle/sil → geçmiş proje (proje bağı boş) müşteri+saha ile devreye alma.
- Deploy YALNIZ kullanıcı "deploy" dediğinde.
