# Faz 2 — Proje İcra Kaydı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kazanılan fırsatları, sıralı 5 aşamalı (teknik → satın alma → saha → montaj → hakediş) bir icra sürecinde, aşama-bazlı görev üretimi ve ayrı bir "Projeler" panosuyla takip etmek.

**Architecture:** Yeni koleksiyon yok — kazanılan `opportunities` kaydı geriye uyumlu icra alanları (`execActive/execStage/…`) kazanır ve "aktif proje" olur. Görevler Faz 1 zincirini (`linkType:'opportunity'`, `context:'proje'`) korur, üstüne `execStage` alanı eklenir. Tüm alanlar okuma-anında varsayılanlı (migration yok). Yeni "🏗 Projeler" sekmesi projeleri İcra bekleyen / Aktif (Liste+Kanban) / Kapanan olarak gösterir.

**Tech Stack:** Tek dosya `APRO_CRM_Firebase.html` — Firebase Firestore + Vanilla JS + özel sanal-DOM `h(tag,attrs,...children)`; `state`+`render()`+`setState()`. Test çerçevesi yok; her adım `node vm.Script` syntax derleme kontrolü + elle doğrulama.

**Referans spec:** `docs/superpowers/specs/2026-07-30-faz2-proje-icra-design.md`

---

## Ortak — Syntax Test Komutu

Her "syntax test" adımında **bu komut** çalıştırılır, beklenen çıktı `✅ SYNTAX OK`:

```bash
node -e "const fs=require('fs');const html=fs.readFileSync('APRO_CRM_Firebase.html','utf8');const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];const main=scripts.filter(s=>s[1].length>1000).pop();const vm=require('vm');try{new vm.Script(main[1]);console.log('✅ SYNTAX OK');}catch(e){console.log('❌',e.message);}"
```

Bu test **davranışı değil, yalnızca sözdizimini** doğrular (tek dosya + tarayıcı runtime olduğundan birim test yok). Davranış doğrulaması elle yapılır; her görevde belirtilir.

---

## Dosya Yapısı

Tüm değişiklikler tek dosyada: **`APRO_CRM_Firebase.html`**. Sorumluluk sınırları:

- **Veri katmanı** (~798–841): `normTask` genişleme + proje erişim yardımcıları (`projStage` vb.).
- **Görev/şablon katmanı** (~6308–6342): aşama sabitleri, şablonlar, akış yardımcıları, `suggestStageTasks`.
- **Fırsat kartı** (~4926): Faz 1 geçiş düğmesinin kaldırılması.
- **Menü/dispatch** (~7184, ~7387, ~7418): "Projeler" sekmesi + `renderProjeler` + `buildProjeModal` yönlendirmesi.
- **Ekran katmanı** (yeni fonksiyonlar, dosya sonuna yakın): `renderProjeler`, `renderProjeKanban`, `buildProjeModal`.
- **PMOD state** (716): proje görünüm/filtre alanları.
- **Fırsat modalı** (`buildOppModal` ~1672): KAZANILDI'dan çıkış koruması.

---

### Task 1: Veri modeli — `normTask.execStage` + proje erişim yardımcıları

**Files:**
- Modify: `APRO_CRM_Firebase.html` (normTask return bloğu ~819; yardımcılar normTask'tan sonra ~821)

- [ ] **Step 1: `normTask`'a `execStage` varsayılanı ekle**

`APRO_CRM_Firebase.html` içinde normTask return bloğundaki `comments:` satırını bul:

```javascript
    comments: Array.isArray(t.comments)? t.comments : [],
  });
}
```

Şununla değiştir (yeni satır eklenir):

```javascript
    comments: Array.isArray(t.comments)? t.comments : [],
    execStage: t.execStage || '',
  });
}
```

- [ ] **Step 2: Proje erişim yardımcılarını ekle**

Aynı `}` (normTask kapanışı) ile `// "Kapalı" (iş bitti) sayılan durumlar:` yorumu arasına, normTask'tan hemen sonra ekle:

```javascript
}
// ---- Faz 2: Proje icra erişimcileri (okuma-anında varsayılan, migration yok) ----
function projStage(o){ return (o && o.execStage) || 'teknik'; }
function projIsActive(o){ return !!(o && o.execActive===true && !o.execClosedAt); }
function projIsAwaiting(o){ return !!(o && o.stage==='KAZANILDI' && o.execActive!==true); }
function projIsClosed(o){ return !!(o && o.execActive===true && o.execClosedAt); }
// "Kapalı" (iş bitti) sayılan durumlar:
```

(Not: mevcut `// "Kapalı" (iş bitti) sayılan durumlar:` yorumu `taskIsClosed`'un üstündedir; yukarıdaki blok onu bozmadan araya girer — dikkat: yorum satırı iki kez yazılmaz, mevcut olanı koru. Yalnızca 4 fonksiyonu ekle.)

- [ ] **Step 3: Syntax test**

Ortak komutu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 4: Erişimci doğrulaması (elle, node)**

```bash
node -e "
const fs=require('fs');let h=fs.readFileSync('APRO_CRM_Firebase.html','utf8');
console.log('execStage in normTask:', /execStage: t\.execStage \|\| ''/.test(h));
console.log('projStage def:', /function projStage\(o\)/.test(h));
console.log('projIsActive def:', /function projIsActive\(o\)/.test(h));
console.log('projIsAwaiting def:', /function projIsAwaiting\(o\)/.test(h));
console.log('projIsClosed def:', /function projIsClosed\(o\)/.test(h));
"
```
Beklenen: 5 satır da `true`.

- [ ] **Step 5: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz2): normTask execStage + proje icra erişimcileri"
```

---

### Task 2: Aşama sabitleri, şablonlar, akış yardımcıları + Faz 1 geçiş düğmesini kaldır

**Files:**
- Modify: `APRO_CRM_Firebase.html` (Faz 2 bloğu `suggestTasksFor` sonrası ~6342; `TASK_TEMPLATES.proje` kaldırma ~6309; fırsat kartı düğmesi ~4926)

- [ ] **Step 1: `TASK_TEMPLATES`'ten kullanılmayan `proje` listesini kaldır**

`const TASK_TEMPLATES = {` bloğunda `proje: [ ... ],` alt bloğunun tamamını (5 satırlık görev listesi + kapanış `],`) sil. `servis: [...]` kalır. Sonuç:

```javascript
const TASK_TEMPLATES = {
  servis: [
    { title:'Randevu & teknisyen planlama',   dept:'teknik',   dueOffset:2,  priority:'orta'  },
    { title:'Yedek parça / malzeme temini',   dept:'muhasebe', dueOffset:3,  priority:'orta'  },
    { title:'Saha müdahale',                  dept:'teknik',   dueOffset:5,  priority:'yuksek' },
    { title:'Test & devreye alma',            dept:'teknik',   dueOffset:6,  priority:'orta'  },
    { title:'Servis raporu & teslim',         dept:'teknik',   dueOffset:7,  priority:'orta'  },
  ],
};
```

- [ ] **Step 2: Faz 2 sabitleri + yardımcıları ekle**

`suggestTasksFor` fonksiyonunun kapanışından hemen sonra, `// Otomatik görev üretimi (spec §11.4)` yorumundan **önce** aşağıdaki bloğu ekle:

```javascript
// ================= FAZ 2: PROJE İCRA =================
const PROJECT_STAGES = ['teknik','satinalma','saha','montaj','hakedis'];
const PROJECT_STAGE_META = {
  teknik:    { l:'Teknik/Ofis',     icon:'📐', color:'#4338ca' },
  satinalma: { l:'Satın Alma',      icon:'🛒', color:'#b45309' },
  saha:      { l:'Saha Hazırlık',   icon:'🚧', color:'#0e7490' },
  montaj:    { l:'İmalat/Montaj',   icon:'🔧', color:'#047857' },
  hakedis:   { l:'Hakediş/Kapanış', icon:'📑', color:'#7c3aed' },
};
const PROJECT_STAGE_TEMPLATES = {
  teknik: [
    { title:'Sözleşme / iş emri açılışı',       dept:'proje',    dueOffset:2,  priority:'yuksek' },
    { title:'Hidrolik hesap / sistem tasarımı', dept:'teknik',   dueOffset:5,  priority:'yuksek' },
    { title:'Uygulama (shop drawing) çizimi',   dept:'teknik',   dueOffset:8,  priority:'orta'  },
    { title:'Malzeme listesi (BOQ) çıkarma',    dept:'teknik',   dueOffset:8,  priority:'orta'  },
  ],
  satinalma: [
    { title:'Tedarikçi teklif toplama',         dept:'muhasebe', dueOffset:3,  priority:'orta'  },
    { title:'Malzeme siparişi',                 dept:'muhasebe', dueOffset:5,  priority:'yuksek' },
    { title:'Sevkiyat / teslim takibi',         dept:'muhasebe', dueOffset:10, priority:'orta'  },
  ],
  saha: [
    { title:'Saha ölçü doğrulama',              dept:'saha',     dueOffset:2,  priority:'orta'  },
    { title:'İSG / izin dosyası',               dept:'muhasebe', dueOffset:3,  priority:'yuksek' },
    { title:'Ekip / ekipman mobilizasyon',      dept:'muhasebe', dueOffset:4,  priority:'orta'  },
  ],
  montaj: [
    { title:'Boru / sprinkler montajı',         dept:'saha',     dueOffset:10, priority:'yuksek' },
    { title:'Pano / algılama montajı',          dept:'saha',     dueOffset:12, priority:'yuksek' },
    { title:'Test & devreye alma',              dept:'teknik',   dueOffset:14, priority:'yuksek' },
  ],
  hakedis: [
    { title:'Geçici kabul',                     dept:'saha',     dueOffset:3,  priority:'orta'  },
    { title:'As-built (imalat sonu çizim)',     dept:'saha',     dueOffset:5,  priority:'orta'  },
    { title:'Kesin kabul',                      dept:'saha',     dueOffset:7,  priority:'orta'  },
    { title:'Hakediş dosyası',                  dept:'proje',    dueOffset:5,  priority:'yuksek' },
  ],
};

// Bir projenin belirli aşamasına ait görevler (boş execStage aktif aşamaya sayılır).
function projStageTasks(o, stage){
  return (state.tasks||[]).map(normTask).filter(t=>
    t.linkType==='opportunity' && t.linkId===o.id &&
    ((t.execStage||projStage(o))===stage));
}
function projOpenCount(o, stage){ return projStageTasks(o,stage).filter(t=>!taskIsClosed(t)).length; }
function _projStageIndex(s){ const i=PROJECT_STAGES.indexOf(s); return i<0?0:i; }

// Aşamaya geçince o aşamanın şablon görevlerini öner (Faz 1 confirm-akışıyla aynı; kör üretim yok).
async function suggestStageTasks(o, stage){
  const tpl = PROJECT_STAGE_TEMPLATES[stage]; if(!tpl) return;
  const people = personelPeople();
  const firstInDept = dept => { const u=people.find(x=>x.department===dept); return u?u.displayName:''; };
  const existing = new Set((state.tasks||[]).map(normTask).filter(t=>t.linkType==='opportunity'&&t.linkId===o.id).map(t=>t.title));
  const toAdd = tpl.filter(x=>!existing.has(x.title)).map(x=>normTask({
    id: genId(), title:x.title, desc:'', assignedTo:firstInDept(x.dept), department:x.dept,
    assignedBy:(state.currentUser&&state.currentUser.displayName)||'', context:'proje',
    linkType:'opportunity', linkId:o.id, linkLabel:o.title||'Proje', execStage:stage,
    dueDate:_offsetDay(x.dueOffset), dueTime:'', startDate:'',
    status:'yapilacak', completedAt:null, priority:x.priority,
    needsApproval:defaultNeedsApproval('proje',x.priority), revisionCount:0, assignmentHistory:[], comments:[],
    autoGenerated:true, createdBy:'şablon', createdAt:today(), fiscalYear:activeFiscalYear()
  }));
  if(!toAdd.length) return;
  if(!confirm(PROJECT_STAGE_META[stage].l+' aşaması için '+toAdd.length+' görev oluşturulsun mu?\n\n- '+toAdd.map(t=>t.title).join('\n- '))) return;
  for(const t of toAdd){ await personelSaveDoc('tasks', t); }
  showToast('✅ '+toAdd.length+' görev oluşturuldu.');
}

// İcraya başlat (kazanılmış fırsat → aktif proje, teknik aşama).
async function projStart(o){
  const now=today(), me=(state.currentUser&&state.currentUser.displayName)||'';
  const upd=Object.assign({}, o, { execActive:true, execStage:'teknik', execStartedAt:now, execClosedAt:null,
    execStageHistory:[...(o.execStageHistory||[]), {stage:'teknik', at:now, by:me}] });
  await personelSaveDoc('opportunities', upd);
  await suggestStageTasks(upd, 'teknik');
}
// Sonraki aşamaya geç (sıralı; açık görev varsa uyar).
async function projAdvance(o){
  const idx=_projStageIndex(projStage(o));
  if(idx>=PROJECT_STAGES.length-1) return;
  const cur=PROJECT_STAGES[idx];
  const open=projOpenCount(o, cur);
  if(open>0 && !confirm('Bu aşamada '+open+' açık görev var. Yine de sonraki aşamaya geçilsin mi?')) return;
  const next=PROJECT_STAGES[idx+1];
  const now=today(), me=(state.currentUser&&state.currentUser.displayName)||'';
  const upd=Object.assign({}, o, { execStage:next, execStageHistory:[...(o.execStageHistory||[]), {stage:next, at:now, by:me}] });
  await personelSaveDoc('opportunities', upd);
  await suggestStageTasks(upd, next);
}
// Projeyi kapat (hakediş sonrası).
async function projClose(o){
  if(!confirm('Proje kapatılsın mı? (Hakediş/kapanış tamamlandı)')) return;
  const upd=Object.assign({}, o, { execClosedAt:today() });
  await personelSaveDoc('opportunities', upd);
}
// Yönetici geri-adım: kapanmışsa yeniden aç, değilse bir önceki aşamaya çek.
async function projRollback(o){
  const now=today(), me=(state.currentUser&&state.currentUser.displayName)||'';
  let upd;
  if(o.execClosedAt){ upd=Object.assign({}, o, { execClosedAt:null }); }
  else { const idx=_projStageIndex(projStage(o)); if(idx<=0) return;
    const prev=PROJECT_STAGES[idx-1];
    upd=Object.assign({}, o, { execStage:prev, execStageHistory:[...(o.execStageHistory||[]), {stage:prev, at:now, by:me, rollback:true}] }); }
  await personelSaveDoc('opportunities', upd);
}
// ================= /FAZ 2 =================
```

- [ ] **Step 3: Fırsat kartındaki Faz 1 "📋 Görev öner" düğmesini kaldır**

`APRO_CRM_Firebase.html` ~4926'daki şu satırı bul:

```javascript
            o.stage==='KAZANILDI'?btn('📋 Görev öner',()=>suggestTasksFor('proje','opportunity',o.id,o.title||'Fırsat'),'#eef2ff','#4338ca','7px 12px',{fontSize:'12px',border:'1px solid #c7d2fe',borderRadius:'7px'}):h('span'),
```

Şununla değiştir (düğme kaldırılır; icra artık Projeler menüsünden başlar):

```javascript
            h('span'),
```

- [ ] **Step 4: Syntax test**

Ortak komutu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 5: Referans doğrulaması (elle, node)**

```bash
node -e "
const fs=require('fs');let h=fs.readFileSync('APRO_CRM_Firebase.html','utf8');
console.log('PROJECT_STAGES:', /const PROJECT_STAGES =/.test(h));
console.log('templates 5 stage:', ['teknik','satinalma','saha','montaj','hakedis'].every(k=>new RegExp('  '+k+': \[').test(h)));
console.log('suggestStageTasks:', /async function suggestStageTasks/.test(h));
console.log('projStart/Advance/Close/Rollback:', /projStart/.test(h)&&/projAdvance/.test(h)&&/projClose/.test(h)&&/projRollback/.test(h));
console.log('faz1 proje button removed:', !/suggestTasksFor\('proje'/.test(h));
console.log('servis template kept:', /suggestTasksFor\('servis'/.test(h) && /  servis: \[/.test(h));
console.log('TASK_TEMPLATES.proje removed:', !/  proje: \[/.test(h));
"
```
Beklenen: tüm satırlar `true`.

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz2): aşama sabitleri, şablonlar, akış yardımcıları; faz1 proje öner düğmesi kaldırıldı"
```

---

### Task 3: "Projeler" menüsü + `renderProjeler` (bölmeler, rol, Liste)

**Files:**
- Modify: `APRO_CRM_Firebase.html` (PMOD ~716; TABS ~7184; dispatch ~7387; yeni `renderProjeler` — `renderTaskKanban` fonksiyonundan sonra, ~6900 civarı)

- [ ] **Step 1: PMOD'a proje state alanları ekle**

`let PMOD = { ... };` satırını bul (716) ve sonuna proje alanlarını ekle:

```javascript
let PMOD = { taskFilter:'acik', taskAdd:false, draft:null, perfOpen:{}, primOpen:{}, settingsOpen:false, taskCtx:'hepsi', taskView:'liste', taskDept:'', taskPerson:'', projView:'liste', projDept:'', projPerson:'', projShowClosed:false };
```

- [ ] **Step 2: TABS'e "Projeler" sekmesi ekle**

`const TABS=[...]` (7184) içinde `{id:'personel',...}`'den **önce** proje sekmesini ekle:

```javascript
  const TABS=[{id:'dashboard',l:'📊 Dashboard'},{id:'customers',l:'👥 Müşteriler'},{id:'suppliers',l:'🏭 Tedarikçiler'},{id:'appointments',l:'📅 Randevular'},{id:'visits',l:'📝 Ziyaretler'},{id:'opportunities',l:'🎯 Fırsatlar'},{id:'proposals',l:'📄 Teklif Talepleri'},{id:'services',l:'_SERVIS_MENU_'},{id:'projeler',l:'🏗 Projeler'},{id:'personel',l:'🧑‍💼 Personel'}];
```

- [ ] **Step 3: Dispatch'e `projeler` dalını ekle**

`else if(state.tab==='personel') content=renderPersonel();` satırını bul (~7394) ve **öncesine** ekle:

```javascript
  else if(state.tab==='projeler') content=renderProjeler();
```

- [ ] **Step 4: `renderProjeler` fonksiyonunu ekle**

`function renderTaskKanban(tasks){ ... }` fonksiyonunun kapanışından sonra ekle:

```javascript
function projFilterMgr(list, isAdmin){
  if(isAdmin && PMOD.projDept) list = list.filter(o=>{
    // projede departman = aktif aşamanın baskın departmanı yerine, sahip departmanına göre değil;
    // basitlik için: projeye bağlı görevlerin departmanlarından biri eşleşiyorsa göster.
    const deps = new Set((state.tasks||[]).map(normTask).filter(t=>t.linkType==='opportunity'&&t.linkId===o.id).map(t=>t.department));
    return deps.has(PMOD.projDept);
  });
  if(isAdmin && PMOD.projPerson) list = list.filter(o=>o.assignedTo===PMOD.projPerson);
  return list;
}
function projListRow(o, isAdmin){
  const st=projStage(o), meta=PROJECT_STAGE_META[st], open=projOpenCount(o, st);
  const cust=(typeof custById==='function' && custById(o.customerId)) || null;
  return h('div',{style:{background:'#fff',border:'1px solid #d0daea',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',flexWrap:'wrap',alignItems:'center',gap:'10px'},onclick:()=>setState({modal:{type:'proje',oppId:o.id}})},
    h('div',{style:{flex:'1',minWidth:'160px'}},
      h('div',{style:{fontWeight:'700',color:'#0f2040',fontSize:'14px'}},o.title||'(başlıksız)'),
      cust?h('div',{style:{fontSize:'12px',color:T3}},'👤 '+(cust.name||cust.title||'')):h('span')
    ),
    h('span',{style:{background:meta.color+'18',color:meta.color,border:'1px solid '+meta.color+'55',borderRadius:'20px',padding:'4px 10px',fontSize:'12px',fontWeight:'700'}},meta.icon+' '+meta.l),
    open?h('span',{style:{background:'#fef2f2',color:'#dc2626',borderRadius:'20px',padding:'4px 10px',fontSize:'12px',fontWeight:'700'}},open+' açık görev'):h('span',{style:{color:'#16a34a',fontSize:'12px',fontWeight:'700'}},'✓ temiz')
  );
}
function renderProjeler(){
  const cu=state.currentUser; const isAdmin=!!(cu&&cu.isAdmin); const myName=cu&&cu.displayName;
  let all=(state.opportunities||[]);
  if(!isAdmin) all=all.filter(o=>o.assignedTo===myName);
  let awaiting=all.filter(projIsAwaiting);
  let active=projFilterMgr(all.filter(projIsActive), isAdmin);
  let closed=all.filter(projIsClosed);

  const header=h('div',{style:{display:'flex',alignItems:'center',gap:'10px',flexWrap:'wrap',marginBottom:'14px'}},
    h('h2',{style:{margin:'0',fontSize:'20px',color:'#0f2040'}},'🏗 Projeler'),
    h('span',{style:{color:T3,fontSize:'13px'}},active.length+' aktif · '+awaiting.length+' bekleyen · '+closed.length+' kapanan')
  );

  // Yönetici filtreleri
  let mgrBar=h('span');
  if(isAdmin){
    const deptOpts=[{v:'',l:'Tüm departmanlar'},...DEPARTMENTS.map(d=>({v:d.v,l:d.l}))];
    const perOpts=[{v:'',l:'Tüm kişiler'},...personelPeople().map(u=>({v:u.displayName,l:u.displayName}))];
    mgrBar=h('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'12px'}},
      sel(deptOpts, PMOD.projDept, v=>{PMOD.projDept=v;render();}),
      sel(perOpts, PMOD.projPerson, v=>{PMOD.projPerson=v;render();})
    );
  }

  // İcra bekleyen
  const awaitingBox = awaiting.length ? h('div',{style:{marginBottom:'16px'}},
    h('div',{style:{fontWeight:'700',color:'#b45309',fontSize:'14px',marginBottom:'8px'}},'⏳ İcra bekleyen (kazanıldı)'),
    ...awaiting.map(o=>h('div',{style:{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',display:'flex',flexWrap:'wrap',alignItems:'center',gap:'10px'}},
      h('div',{style:{flex:'1',minWidth:'160px',fontWeight:'700',color:'#0f2040'}},o.title||'(başlıksız)'),
      btn('🏗 İcraya başlat',()=>projStart(o),'linear-gradient(135deg,#10b981,#059669)','#fff','8px 14px',{fontSize:'13px'})
    ))
  ) : h('span');

  // Aktif projeler — görünüm toggle
  const viewBar=h('div',{style:{display:'flex',gap:'6px',marginBottom:'10px'}},
    btn('📋 Liste',()=>{PMOD.projView='liste';render();},PMOD.projView==='liste'?'#1e3a6e':'#e8eef7',PMOD.projView==='liste'?'#fff':'#2a5080','7px 13px',{fontSize:'12px'}),
    btn('🗂 Kanban',()=>{PMOD.projView='kanban';render();},PMOD.projView==='kanban'?'#1e3a6e':'#e8eef7',PMOD.projView==='kanban'?'#fff':'#2a5080','7px 13px',{fontSize:'12px'})
  );
  const isMobile = window.innerWidth<=768;
  const activeBody = (!active.length)
    ? h('div',{style:{padding:'24px',textAlign:'center',color:T4,background:'#fff',borderRadius:'12px',border:'1px solid #d0daea'}},'Aktif proje yok.')
    : ((PMOD.projView==='kanban' && !isMobile) ? renderProjeKanban(active, isAdmin)
        : h('div',{}, ...active.map(o=>projListRow(o,isAdmin))));

  // Kapanan projeler (katlanır)
  const closedBox = closed.length ? h('div',{style:{marginTop:'16px'}},
    btn((PMOD.projShowClosed?'▾':'▸')+' Kapanan projeler ('+closed.length+')',()=>{PMOD.projShowClosed=!PMOD.projShowClosed;render();},'#eef2f7','#334155','7px 12px',{fontSize:'12px'}),
    PMOD.projShowClosed ? h('div',{style:{marginTop:'8px'}}, ...closed.map(o=>projListRow(o,isAdmin))) : h('span')
  ) : h('span');

  return h('div',{}, header, mgrBar, awaitingBox,
    h('div',{style:{fontWeight:'700',color:'#0f2040',fontSize:'14px',margin:'4px 0 8px'}},'🚀 Aktif projeler'),
    viewBar, activeBody, closedBox);
}
```

**Not:** `projFilterMgr` içinde `o` kapanış değişkeni `list.filter(o=>…)` ile gelir; yukarıdaki blokta departman filtresi kapanışı `o`'yu kullanır — bu kasıtlıdır.

- [ ] **Step 5: Kanban çağrısı için geçici stub ekle** (Task 4'te doldurulacak)

`renderProjeler` fonksiyonundan **önce** geçici bir stub ekle (Task 4 gerçek gövdeyle değiştirecek), böylece `projView==='kanban'` çağrısı tanımsız kalmaz:

```javascript
function renderProjeKanban(list, isAdmin){ return h('div',{}, ...list.map(o=>projListRow(o,isAdmin))); }
```

- [ ] **Step 6: Syntax test**

Ortak komutu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 7: Elle doğrulama (tarayıcı)**

`APRO_CRM_Firebase.html`'i tarayıcıda aç → giriş yap → üst menüde "🏗 Projeler" sekmesi görünmeli. Tıkla: başlık + "Aktif projeler" + (varsa) "İcra bekleyen" bölmesi görünmeli. Bir KAZANILDI fırsat varsa "İcraya başlat" düğmesi çıkmalı. **Not:** Kart tıklama modalı Task 5'te gelecek — şimdilik tıklama modal açmaya çalışır ama `buildProjeModal` yoksa boş kalabilir; hata vermemeli.

- [ ] **Step 8: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz2): Projeler menüsü + renderProjeler (bekleyen/aktif liste/kapanan, rol görünürlüğü)"
```

---

### Task 4: Kanban görünümü (`renderProjeKanban`)

**Files:**
- Modify: `APRO_CRM_Firebase.html` (Task 3'te eklenen `renderProjeKanban` stub'ını gerçek gövdeyle değiştir)

- [ ] **Step 1: Stub'ı gerçek kanban ile değiştir**

Task 3 Step 5'te eklenen şu satırı bul:

```javascript
function renderProjeKanban(list, isAdmin){ return h('div',{}, ...list.map(o=>projListRow(o,isAdmin))); }
```

Şununla değiştir:

```javascript
function renderProjeKanban(list, isAdmin){
  const cols = PROJECT_STAGES.map(st=>{
    const meta=PROJECT_STAGE_META[st];
    const items=list.filter(o=>projStage(o)===st);
    return h('div',{style:{flex:'0 0 220px',minWidth:'220px',background:'#f4f7fb',border:'1px solid #d0daea',borderRadius:'12px',padding:'10px'}},
      h('div',{style:{fontWeight:'700',fontSize:'13px',color:meta.color,marginBottom:'8px',display:'flex',justifyContent:'space-between'}},
        h('span',{},meta.icon+' '+meta.l), h('span',{style:{color:T4}},String(items.length))),
      ...(items.length? items.map(o=>{
        const open=projOpenCount(o, st);
        return h('div',{style:{background:'#fff',border:'1px solid #d0daea',borderRadius:'10px',padding:'9px 10px',marginBottom:'8px',cursor:'pointer'},onclick:()=>setState({modal:{type:'proje',oppId:o.id}})},
          h('div',{style:{fontWeight:'700',fontSize:'13px',color:'#0f2040'}},o.title||'(başlıksız)'),
          open?h('div',{style:{fontSize:'11px',color:'#dc2626',marginTop:'4px',fontWeight:'700'}},open+' açık görev'):h('div',{style:{fontSize:'11px',color:'#16a34a',marginTop:'4px'}},'✓ temiz')
        );
      }) : [h('div',{style:{color:T4,fontSize:'12px',padding:'6px'}},'—')])
    );
  });
  return h('div',{style:{display:'flex',gap:'10px',overflowX:'auto',paddingBottom:'8px'}}, ...cols);
}
```

- [ ] **Step 2: Syntax test**

Ortak komutu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 3: Elle doğrulama (tarayıcı, masaüstü genişlik)**

Projeler sekmesinde "🗂 Kanban" düğmesine bas. 5 aşama sütunu yatay dizilmeli; aktif projeler `execStage`'ine göre doğru sütunda kart olarak görünmeli. Mobil genişlikte (≤768) Liste'ye düştüğü için kanban görünmez (bu beklenen).

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz2): Projeler kanban görünümü (aşama sütunları)"
```

---

### Task 5: Proje detay modalı (`buildProjeModal`) — aşama şeridi + aksiyonlar + görev listesi

**Files:**
- Modify: `APRO_CRM_Firebase.html` (modal dispatch ~7418; yeni `buildProjeModal` — `renderProjeKanban` sonrası)

- [ ] **Step 1: Modal dispatch'e `proje` dalını ekle**

`else if(type==='opportunity') m=buildOppModal(item);` satırını bul (~7418) ve **öncesine** ekle:

```javascript
    else if(type==='proje') m=buildProjeModal(state.modal.oppId);
```

- [ ] **Step 2: `buildProjeModal` fonksiyonunu ekle**

`renderProjeKanban` fonksiyonunun kapanışından sonra ekle:

```javascript
function buildProjeModal(oppId){
  const cu=state.currentUser; const isAdmin=!!(cu&&cu.isAdmin); const myName=cu&&cu.displayName;
  const o=(state.opportunities||[]).find(x=>x.id===oppId);
  if(!o) return modal('Proje', h('div',{},'Proje bulunamadı.'), ()=>setState({modal:null}), '640px');
  const st=projStage(o), idx=_projStageIndex(st), closed=!!o.execClosedAt;

  // Aşama şeridi
  const strip=h('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'14px'}},
    ...PROJECT_STAGES.map((s,i)=>{
      const meta=PROJECT_STAGE_META[s];
      const state_ = i<idx?'done':(i===idx?'active':'todo');
      const bg = state_==='active'?meta.color:(state_==='done'?'#16a34a':'#e8eef7');
      const col = (state_==='active'||state_==='done')?'#fff':'#64748b';
      return h('span',{style:{background:bg,color:col,borderRadius:'20px',padding:'5px 11px',fontSize:'12px',fontWeight:'700'}},
        (state_==='done'?'✓ ':meta.icon+' ')+meta.l);
    })
  );

  // Aksiyonlar
  const acts=[];
  if(!closed && idx<PROJECT_STAGES.length-1) acts.push(btn('Sonraki aşama →',async()=>{await projAdvance(o); render();},'#1e3a6e','#fff','8px 14px',{fontSize:'13px'}));
  if(!closed && idx===PROJECT_STAGES.length-1) acts.push(btn('✓ Projeyi kapat',async()=>{await projClose(o); render();},'linear-gradient(135deg,#10b981,#059669)','#fff','8px 14px',{fontSize:'13px'}));
  if(isAdmin && (closed || idx>0)) acts.push(btn(closed?'↺ Yeniden aç':'← Geri al',async()=>{await projRollback(o); render();},'#fef3c7','#92400e','8px 14px',{fontSize:'13px'}));
  acts.push(btn('+ Bu aşamaya görev öner',async()=>{await suggestStageTasks(o, st); render();},'#eef2ff','#4338ca','8px 14px',{fontSize:'13px'}));
  const actBar=h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}}, ...acts);

  // Görevler — aşamalara göre grupla (Faz 1 taskCard yeniden kullanılır)
  const groups=PROJECT_STAGES.map(s=>{
    const ts=projStageTasks(o, s);
    if(!ts.length) return null;
    return h('div',{style:{marginBottom:'12px'}},
      h('div',{style:{fontWeight:'700',fontSize:'13px',color:PROJECT_STAGE_META[s].color,marginBottom:'6px'}},PROJECT_STAGE_META[s].icon+' '+PROJECT_STAGE_META[s].l),
      ...ts.map(t=>taskCard(t, isAdmin, myName))
    );
  }).filter(Boolean);
  const tasksBox = groups.length? h('div',{}, ...groups)
    : h('div',{style:{padding:'16px',textAlign:'center',color:T4}},'Bu projeye bağlı görev yok. "Bu aşamaya görev öner" ile başlayın.');

  const cust=(typeof custById==='function' && custById(o.customerId)) || null;
  const content=h('div',{},
    cust?h('div',{style:{fontSize:'13px',color:T3,marginBottom:'10px'}},'👤 '+(cust.name||cust.title||'')):h('span'),
    strip, actBar,
    h('div',{style:{borderTop:'1px solid #e2e8f0',paddingTop:'12px'}}, tasksBox)
  );
  return modal((o.title||'Proje')+' — İcra', content, ()=>setState({modal:null}), '720px');
}
```

- [ ] **Step 3: Syntax test**

Ortak komutu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 4: Elle doğrulama (tarayıcı)**

1. Projeler → bir aktif projeye tıkla → modal açılmalı: aşama şeridi (tamamlanan ✓ yeşil, aktif renkli, bekleyen gri), aksiyon düğmeleri, görev grupları.
2. "+ Bu aşamaya görev öner" → onayla → görevler eklenmeli, modal görevleri göstermeli.
3. "Sonraki aşama →" → açık görev varsa uyarı çıkmalı; ilerleyince şerit güncellenmeli ve yeni aşama şablonu önerilmeli.
4. Son aşamada "✓ Projeyi kapat" → proje "Kapanan projeler"e düşmeli.
5. Görev kartına tıkla → Faz 1 görev modalı (`openTaskModal`) açılmalı.

- [ ] **Step 5: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz2): proje detay modalı — aşama şeridi, aksiyonlar, aşama-gruplu görev listesi"
```

---

### Task 6: Tutarlılık koruması — KAZANILDI'dan çıkışta icra iptali uyarısı

**Files:**
- Modify: `APRO_CRM_Firebase.html` (`buildOppModal` kaydetme akışı ~1672+)

- [ ] **Step 1: `buildOppModal`'ın kaydet fonksiyonunu bul**

`buildOppModal` içinde kaydetme (save) işlemini yapan yeri bul. Fırsat kaydını yazan `saveDoc('opportunities', ...)` veya `personelSaveDoc('opportunities', ...)` ya da benzeri çağrının hemen öncesini hedefle. (Anchor: `buildOppModal` fonksiyonu 1672'de başlar; içindeki "Kaydet" butonunun `onClick`'i.)

Kaydetme çağrısından **hemen önce** şu koruma bloğunu ekle (değişken adları koddaki forma göre: düzenlenen kayıt `f`, orijinal `item`):

```javascript
    // Faz 2: aktif icrası olan fırsat KAZANILDI'dan çıkarılıyorsa uyar.
    if(item && item.execActive===true && item.stage==='KAZANILDI' && f.stage!=='KAZANILDI'){
      if(!confirm('Bu fırsatın aktif proje icrası var. Aşama KAZANILDI dışına alınırsa icra iptal edilir (görevler kalır). Devam edilsin mi?')) return;
      f.execActive=false;
    }
```

**Not:** `buildOppModal`'daki gerçek değişken adları farklıysa (ör. `f` yerine başka), o adları kullan. Koşul mantığı aynı kalmalı: *orijinal kayıt aktif icra + KAZANILDI iken, yeni stage KAZANILDI değilse → onay iste, onaylanırsa `execActive=false`.*

- [ ] **Step 2: Syntax test**

Ortak komutu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 3: Elle doğrulama (tarayıcı)**

1. Bir fırsatı İcraya başlat (aktif proje yap).
2. Fırsatlar → o fırsatı Düzenle → stage'i "TEKLİF"e çevir → Kaydet.
3. Uyarı çıkmalı; onaylarsan Projeler'de artık aktif görünmemeli (execActive=false), görevleri durmalı ama silinmemeli.
4. İptal edersen kayıt değişmemeli.

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz2): KAZANILDI dışına çıkışta icra iptali koruması"
```

---

## Self-Review Notları (plan yazarı)

**Spec kapsama:**
- Spec §2.1 opp icra alanları → Task 1 (erişimciler) + Task 2/5 (yazımı `projStart/Advance/Close/Rollback`).
- Spec §2.2 task.execStage → Task 1.
- Spec §3 aşama modeli → Task 2 (PROJECT_STAGES/META).
- Spec §4 akış (başlat/ilerle/kapat/geri-al/açık-görev/KAZANILDI-koruma) → Task 2 (helpers) + Task 5 (UI) + Task 6 (koruma).
- Spec §5 şablonlar + suggestStageTasks + Faz1 düğme kaldırma → Task 2.
- Spec §6 Projeler ekranı (bölmeler + Liste/Kanban + detay) → Task 3/4/5.
- Spec §7 rol görünürlüğü → Task 3 (`isAdmin` filtresi + mgrBar).
- Spec §8 entegrasyon (link/cascade/prim/bildirim) → değişiklik gerektirmez; Task 1 `normTask` uyumu korur.

**Tip/İsim tutarlılığı:** `execStage`, `execActive`, `execClosedAt`, `execStageHistory` tüm task'larda aynı. Fonksiyonlar: `projStage/projIsActive/projIsAwaiting/projIsClosed` (Task1), `projStageTasks/projOpenCount/_projStageIndex/suggestStageTasks/projStart/projAdvance/projClose/projRollback` (Task2), `renderProjeler/projListRow/projFilterMgr` (Task3), `renderProjeKanban` (Task3 stub → Task4), `buildProjeModal` (Task5). `PROJECT_STAGES/PROJECT_STAGE_META/PROJECT_STAGE_TEMPLATES` sabit adları her yerde birebir.

**YAGNI kararları:** Öneri paneli yerine Faz 1'in `confirm()` akışı (per-item seçim ertelendi). Finansal hakediş yok. Aşamalar sabit. `normOpp` katmanı yok (erişim-anında varsayılan).

**Bilinen bağımlılık:** Task 3 `renderProjeKanban` stub'ı ekler; Task 4 gerçek gövdeyle **değiştirir** (iki task ayrı commit; Task 3 tek başına da çalışır). Task 5 `buildProjeModal` gelene kadar kart tıklaması modal açmaz ama hata vermez (dispatch dalı yoksa modal null kalır).

**Uygulama sırası bağımlılığı:** Task 6, `buildOppModal`'daki gerçek kaydet değişken adlarına göre uyarlanmalı — implementer o fonksiyonu okuyup `f`/`item` karşılıklarını doğrulamalı.
