# Faz 3a — Arıza Servis İcra Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `services` (Teknik Servis) kayıtlarına, Faz 2 proje-icra desenini birebir yansıtan doğrusal aşama motoru (talep→planlama→müdahale→kapanış) + icra görünümleri ekleyerek arıza müdahalelerinin takibini sağlamak.

**Architecture:** Tek dosya `APRO_CRM_Firebase.html`. Faz 2'nin `opportunities` üzerindeki aşama motoru (`PROJECT_STAGES`, `projStart/projAdvance/...`, `renderProjeKanban`, `buildProjeModal`) `services` eksenine kopyalanır. İcra alanları okuma-anında default'lanır (mevcut kayıtları bozmaz); satış ekseni `status` dokunulmaz. Görevler `linkType:'service'`, `context:'servis'`. UI, mevcut `renderServices` içine sekme çubuğuyla (Tümü/İcra bekleyen/Aktif/Kapanan) gömülür.

**Tech Stack:** Vanilla JS + custom vDOM `h()`, Firebase Firestore, `personelSaveDoc`/`normTask`/`taskCard` yardımcıları. Test yok; doğrulama = `node vm.Script` syntax kontrolü (`✅ SYNTAX OK`) + manuel tarayıcı.

**Spec:** `docs/superpowers/specs/2026-07-30-faz3a-ariza-servis-icra-design.md`

**Ortak doğrulama komutu (her task'ta çalıştır):**

```bash
cd "/Users/erkankaracakale/Desktop/CLAUDE-HAZIRLANAN PROJE DATABASE/A-PRO PLATFORM/A-PRO CRM FULL" && node -e "
const fs=require('fs');
const html=fs.readFileSync('APRO_CRM_Firebase.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const main=scripts.filter(s=>s[1].length>1000).pop();
const vm=require('vm');
try{new vm.Script(main[1]);console.log('✅ SYNTAX OK');}
catch(e){console.log('❌',e.message);}
"
```

Beklenen çıktı: `✅ SYNTAX OK`

**ÖNEMLİ (CLAUDE.md kuralı):** Deploy YOK. Yalnız `APRO_CRM_Firebase.html` düzenlenir; `index.html` kopyalama / `git push` YAPILMAZ (kullanıcı ayrıca "deploy" demedikçe).

---

### Task 1: Salt-okuma güvenli erişimciler + durum yardımcıları

Faz 2'deki `projStage/projIsActive/projIsAwaiting/projIsClosed` (satır 824-827) desenini `services` için kur. `SERVICE_STAGES` Task 2'de tanımlanacağı için `typeof` guard kullanılır (Faz 2'de `projStage` de böyle: tanımdan önce yazılır, runtime'da çağrılır).

**Files:**
- Modify: `APRO_CRM_Firebase.html` (satır 827'den sonra — `function projIsClosed(...)` satırının hemen altı)

- [ ] **Step 1: Erişimcileri ekle**

`APRO_CRM_Firebase.html` içinde şu satırı bul (827):

```javascript
function projIsClosed(o){ return !!(o && o.execActive===true && o.execClosedAt); }
```

Bu satırın **hemen altına** şu bloğu ekle:

```javascript
// ===== FAZ 3a: Arıza servis icra — salt-okuma güvenli erişimciler =====
function servExecStage(s){ return (s && typeof SERVICE_STAGES!=='undefined' && SERVICE_STAGES.includes(s.execStage)) ? s.execStage : 'talep'; }
function servIsActive(s){ return !!(s && s.execActive===true && !s.execClosedAt); }
function servIsAwaiting(s){ return !!(s && s.execActive!==true && (s.status==='Onaylandı' || s.status==='Randevu')); }
function servIsClosed(s){ return !!(s && s.execActive===true && s.execClosedAt); }
function servIsOverdue(s){ return !!(s && s.execTargetDate && _toDate(s.execTargetDate) < _toDate(today())); }
```

- [ ] **Step 2: Syntax doğrula**

Ortak doğrulama komutunu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 3: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz3a): arıza servis icra durum erişimcileri"
```

---

### Task 2: FAZ3A motor bloğu (stages + şablonlar + aşama fonksiyonları)

Faz 2'nin `PROJECT_STAGES` bloğunu (satır 6352-6456) `services` için kopyala. `linkType:'service'`, `context:'servis'`, koleksiyon `'services'`. Rollback (önceki aşama) ve reopen (kapananı aç) ayrı fonksiyonlar (spec §8).

**Files:**
- Modify: `APRO_CRM_Firebase.html` (satır 6457 `// ================= /FAZ 2 =================` satırının hemen altı)

- [ ] **Step 1: Motor bloğunu ekle**

`APRO_CRM_Firebase.html` içinde şu satırı bul (6457):

```javascript
// ================= /FAZ 2 =================
```

Bu satırın **hemen altına** şu bloğu ekle:

```javascript
// ================= FAZ 3a: ARIZA SERVİS İCRA =================
const SERVICE_STAGES = ['talep','planlama','mudahale','kapanis'];
const SERVICE_STAGE_META = {
  talep:    { l:'Talep',     icon:'📩', color:'#6366f1' },
  planlama: { l:'Planlama',  icon:'📅', color:'#0891b2' },
  mudahale: { l:'Müdahale',  icon:'🔧', color:'#d97706' },
  kapanis:  { l:'Kapanış',   icon:'✅', color:'#16a34a' },
};
const SERVICE_STAGE_TEMPLATES = {
  talep:    [ { title:'Arıza detayı + müşteri bilgisi teyidi',    dept:'teknik', dueOffset:1, priority:'yuksek' } ],
  planlama: [ { title:'Müşteriyle gün/saat teyidi',               dept:'teknik', dueOffset:1, priority:'yuksek' } ],
  mudahale: [ { title:'Arıza tespiti + parça/malzeme kontrolü',   dept:'teknik', dueOffset:2, priority:'yuksek' } ],
  kapanis:  [ { title:'Servis formu imzalat + memnuniyet teyidi', dept:'teknik', dueOffset:1, priority:'orta'   } ],
};
function servStageTasks(s, stage){
  return (state.tasks||[]).map(normTask).filter(t=>
    t.linkType==='service' && t.linkId===s.id &&
    ((t.execStage||servExecStage(s))===stage));
}
function servOpenCount(s, stage){ return servStageTasks(s,stage).filter(t=>!taskIsClosed(t)).length; }
function _servStageIndex(st){ const i=SERVICE_STAGES.indexOf(st); return i<0?0:i; }
async function suggestServStageTasks(s, stage){
  const tpl = SERVICE_STAGE_TEMPLATES[stage]; if(!tpl) return;
  const people = personelPeople();
  const firstInDept = dept => { const u=people.find(x=>x.department===dept); return u?u.displayName:''; };
  const existing = new Set((state.tasks||[]).map(normTask).filter(t=>t.linkType==='service'&&t.linkId===s.id).map(t=>t.title));
  const toAdd = tpl.filter(x=>!existing.has(x.title)).map(x=>normTask({
    id: genId(), title:x.title, desc:'', assignedTo:firstInDept(x.dept), department:x.dept,
    assignedBy:(state.currentUser&&state.currentUser.displayName)||'', context:'servis',
    linkType:'service', linkId:s.id, linkLabel:s.jobName||'Arıza', execStage:stage,
    dueDate:_offsetDay(x.dueOffset), dueTime:'', startDate:'',
    status:'yapilacak', completedAt:null, priority:x.priority,
    needsApproval:defaultNeedsApproval('servis',x.priority), revisionCount:0, assignmentHistory:[], comments:[],
    autoGenerated:true, createdBy:'şablon', createdAt:today(), fiscalYear:activeFiscalYear()
  }));
  if(!toAdd.length) return;
  if(!confirm(SERVICE_STAGE_META[stage].l+' aşaması için '+toAdd.length+' görev oluşturulsun mu?\n\n- '+toAdd.map(t=>t.title).join('\n- '))) return;
  for(const t of toAdd){ await personelSaveDoc('tasks', t); }
  showToast('✅ '+toAdd.length+' görev oluşturuldu.');
}
// İcraya al (manuel; arıza talebi geldi).
async function servStart(s){
  const now=today(), me=(state.currentUser&&state.currentUser.displayName)||'';
  const upd=Object.assign({}, s, { execActive:true, execStage:'talep', execStartedAt:now, execClosedAt:null,
    execUrgency:s.execUrgency||'normal', execTargetDate:s.execTargetDate||'',
    execStageHistory:[...(s.execStageHistory||[]), {stage:'talep', at:now, by:me}] });
  await personelSaveDoc('services', upd);
  await suggestServStageTasks(upd, 'talep');
}
// Sonraki aşama (sıralı; açık görev varsa uyar).
async function servAdvance(s){
  const idx=_servStageIndex(servExecStage(s));
  if(idx>=SERVICE_STAGES.length-1) return;
  const cur=SERVICE_STAGES[idx];
  const open=servOpenCount(s, cur);
  if(open>0 && !confirm('Bu aşamada '+open+' açık görev var. Yine de sonraki aşamaya geçilsin mi?')) return;
  const next=SERVICE_STAGES[idx+1];
  const now=today(), me=(state.currentUser&&state.currentUser.displayName)||'';
  const upd=Object.assign({}, s, { execStage:next, execStageHistory:[...(s.execStageHistory||[]), {stage:next, at:now, by:me}] });
  await personelSaveDoc('services', upd);
  await suggestServStageTasks(upd, next);
}
// Arızayı kapat (kapanış notu iste — R7).
async function servClose(s){
  const note=prompt('Kapanış — yapılan işlem + değişen parça (opsiyonel):', s.execCloseNote||'');
  if(note===null) return;
  const upd=Object.assign({}, s, { execClosedAt:today(), execCloseNote:note });
  await personelSaveDoc('services', upd);
}
// Yönetici: bir önceki aşamaya çek.
async function servRollback(s){
  const now=today(), me=(state.currentUser&&state.currentUser.displayName)||'';
  const idx=_servStageIndex(servExecStage(s)); if(idx<=0) return;
  const prev=SERVICE_STAGES[idx-1];
  const upd=Object.assign({}, s, { execStage:prev, execStageHistory:[...(s.execStageHistory||[]), {stage:prev, at:now, by:me, rollback:true}] });
  await personelSaveDoc('services', upd);
}
// Yönetici: kapananı yeniden aç.
async function servReopen(s){
  const upd=Object.assign({}, s, { execClosedAt:null });
  await personelSaveDoc('services', upd);
}
// ================= /FAZ 3a =================
```

- [ ] **Step 2: Syntax doğrula**

Ortak doğrulama komutunu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 3: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz3a): arıza aşama motoru + şablon görev önerisi"
```

---

### Task 3: Cascade delete (R4) — servis silinince görev temizliği

`delItem` (satır 1474) servisi silerken `linkType:'service'` görevleri temizlemiyor. `cascadeDeleteTasksFor('service',id)` çağrısını `deleteDoc`'tan **önce** ekle (mevcut `opportunity` deseni, satır 4942). Bu fonksiyon yalnız `autoGenerated` görevleri siler; manuel görevler korunur (kasıtlı).

**Files:**
- Modify: `APRO_CRM_Firebase.html:1480` (`delItem` içi)

- [ ] **Step 1: Cascade çağrısını ekle**

`APRO_CRM_Firebase.html` içinde şu iki satırı bul (1480-1481):

```javascript
  await deleteDoc(col, id);
  if(col==='customers') setState({customers:state.customers.filter(x=>x.id!==id)});
```

Şununla değiştir:

```javascript
  if(col==='services'){ await cascadeDeleteTasksFor('service', id); }
  await deleteDoc(col, id);
  if(col==='customers') setState({customers:state.customers.filter(x=>x.id!==id)});
```

- [ ] **Step 2: Syntax doğrula**

Ortak doğrulama komutunu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 3: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "fix(faz3a): servis silince linkType:service görevleri temizle (R4)"
```

---

### Task 4: renderServices sekme çubuğu + icra listeleri (R3, R5, R6)

`renderServices` (satır 5192) sonuna sekme çubuğu (Tümü/İcra bekleyen/Aktif/Kapanan) ve icra görünümleri gömülür. "Tümü" mevcut satış listesidir (bozulmaz). Ayrıca standalone `arizaAwaitingRow` (İcraya al) ve `arizaListRow` (aşama rozeti + açık görev + acil/geciken kırmızı) eklenir. `renderArizaKanban` Task 5'te tanımlanacak (bu task'ta yalnız çağrılır).

**Files:**
- Modify: `APRO_CRM_Firebase.html:716` (PMOD alanları)
- Modify: `APRO_CRM_Firebase.html:5276-5304` (renderServices final return)
- Modify: `APRO_CRM_Firebase.html:5305` sonrası (yeni yardımcı fonksiyonlar)

- [ ] **Step 1: PMOD'a icra alanlarını ekle**

Şu satırı bul (716):

```javascript
let PMOD = { taskFilter:'acik', taskAdd:false, draft:null, perfOpen:{}, primOpen:{}, settingsOpen:false, taskCtx:'hepsi', taskView:'liste', taskDept:'', taskPerson:'', projView:'liste', projDept:'', projPerson:'', projShowClosed:false };
```

Şununla değiştir (sona `arizaTab`/`arizaView` eklendi):

```javascript
let PMOD = { taskFilter:'acik', taskAdd:false, draft:null, perfOpen:{}, primOpen:{}, settingsOpen:false, taskCtx:'hepsi', taskView:'liste', taskDept:'', taskPerson:'', projView:'liste', projDept:'', projPerson:'', projShowClosed:false, arizaTab:'tumu', arizaView:'liste' };
```

- [ ] **Step 2: renderServices final return'ünü sekmeli sürümle değiştir**

Şu bloğu bul (5276'dan başlar, `renderServices` fonksiyonunun son `return`'ü — 5304'teki `);` ile biter):

```javascript
  const isMobSvc = window.innerWidth <= 768;
  return h('div',{style:{animation:'fu .3s ease'}},
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}},
      h('h2',{style:{fontSize:isMobSvc?'17px':'20px',fontWeight:'800',color:'#0f1f35'}},'🔧 Teknik Servis ',h('span',{style:{fontSize:'12px',color:T3,fontWeight:'400'}},'('+svcFiltered.length+'/'+state.services.length+')')),
      btn('+ Yeni Teknik Servis',()=>setState({modal:{type:'service',item:null}}),'linear-gradient(135deg,#0891b2,#0284c7)','#fff',isMobSvc?'9px 14px':'10px 20px',{fontSize:'14px',borderRadius:'10px',boxShadow:'0 3px 8px rgba(8,145,178,.3)'})
    ),
    fyEmptyBanner('services','teknik servis'),
    svcFilterBox,
    isMobSvc ?
    h('div',{style:{display:'flex',flexDirection:'column',gap:'10px'}},
      svcFiltered.length ? svcFiltered.map(s=>{
        const c2=custById(s.customerId);
        return h('div',{style:{background:'#fff',border:'1px solid #b0c8e0',borderRadius:'13px',padding:'13px',boxShadow:'0 2px 6px rgba(20,40,80,.07)'}},
          h('div',{style:{fontWeight:'800',fontSize:'14px',color:'#0f1f35',marginBottom:'6px'}},s.jobName||''),
          h('div',{style:{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'7px'}},
            s.status?badge(s.status,'#0891b2'):h('span'),
            c2?h('span',{style:{background:'#eff6ff',color:'#2563eb',padding:'3px 8px',borderRadius:'12px',fontSize:'11px',fontWeight:'600'}},c2.firmName):h('span'),
            s.preparedBy?h('span',{style:{background:'#f0fdf4',color:'#16a34a',padding:'3px 8px',borderRadius:'12px',fontSize:'11px'}},'👤 '+s.preparedBy):h('span')
          ),
          s.appointmentDate?h('div',{style:{fontSize:'11px',color:T3,marginBottom:'8px'}},'📅 Randevu: '+_toTR(s.appointmentDate)):h('span'),
          h('div',{style:{display:'flex',gap:'8px'}},
            btn('✏️ Düzenle',()=>setState({modal:{type:'service',item:s}}),'#e0f2fe','#0891b2','7px 14px',{fontSize:'12px',border:'1px solid #bae6fd',borderRadius:'7px',flex:'1'}),
            btn('🗑️',()=>delItem('services',s.id),'#fef2f2','#dc2626','7px 12px',{fontSize:'13px',border:'1px solid #fecaca',borderRadius:'7px'})
          )
        );
      }) : [h('div',{style:{padding:'32px',textAlign:'center',color:T4,background:G2,borderRadius:'12px'}},'Filtre sonucu yok.')]
    ) :
    makeScrollTable(thead, tbody, [160,150,120,130,110,110,110,110,110,130,110], !svcFiltered.length, 'Henüz teknik servis kaydı yok.')
  );
}
```

Şununla değiştir:

```javascript
  const isMobSvc = window.innerWidth <= 768;
  // ── FAZ 3a: Arıza icra sekmeleri ──
  const _svcAll=filterFY(state.services, activeFiscalYear());
  const awaitingS=_svcAll.filter(servIsAwaiting);
  const activeS=_svcAll.filter(servIsActive);
  const closedS=_svcAll.filter(servIsClosed);
  const isAdminS=!!(state.currentUser&&state.currentUser.isAdmin);
  const arTab=PMOD.arizaTab||'tumu';
  const tabBar=h('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}},
    ...[['tumu','📋 Tümü',svcFiltered.length],['bekleyen','⏳ İcra bekleyen',awaitingS.length],['aktif','🚀 Aktif',activeS.length],['kapanan','✅ Kapanan',closedS.length]].map(x=>
      btn(x[1]+' ('+x[2]+')',()=>{PMOD.arizaTab=x[0];render();},arTab===x[0]?'#0e7490':'#e8eef7',arTab===x[0]?'#fff':'#2a5080','7px 13px',{fontSize:'12px'}))
  );
  const infoNote=h('div',{style:{fontSize:'11px',color:T4,marginBottom:'10px'}},'ℹ️ Servis İş Takip = servis satış/fırsat; Teknik Servis icra = gelen arıza müdahale takibi.');
  const headerRow=h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px',flexWrap:'wrap',gap:'8px'}},
    h('h2',{style:{fontSize:isMobSvc?'17px':'20px',fontWeight:'800',color:'#0f1f35'}},'🔧 Teknik Servis ',h('span',{style:{fontSize:'12px',color:T3,fontWeight:'400'}},'('+svcFiltered.length+'/'+state.services.length+')')),
    btn('+ Yeni Teknik Servis',()=>setState({modal:{type:'service',item:null}}),'linear-gradient(135deg,#0891b2,#0284c7)','#fff',isMobSvc?'9px 14px':'10px 20px',{fontSize:'14px',borderRadius:'10px',boxShadow:'0 3px 8px rgba(8,145,178,.3)'})
  );

  if(arTab==='bekleyen'){
    return h('div',{style:{animation:'fu .3s ease'}}, headerRow, tabBar, infoNote,
      awaitingS.length ? h('div',{}, ...awaitingS.map(s=>arizaAwaitingRow(s)))
        : h('div',{style:{padding:'24px',textAlign:'center',color:T4,background:'#fff',borderRadius:'12px',border:'1px solid #d0daea'}},'İcra bekleyen arıza yok. (Durumu Onaylandı/Randevu olan, henüz icraya alınmamış servisler burada listelenir.)'));
  }
  if(arTab==='kapanan'){
    return h('div',{style:{animation:'fu .3s ease'}}, headerRow, tabBar, infoNote,
      closedS.length ? h('div',{}, ...closedS.map(s=>arizaListRow(s,isAdminS)))
        : h('div',{style:{padding:'24px',textAlign:'center',color:T4,background:'#fff',borderRadius:'12px',border:'1px solid #d0daea'}},'Kapanan arıza icrası yok.'));
  }
  if(arTab==='aktif'){
    const arView=PMOD.arizaView||'liste';
    const viewToggle=h('div',{style:{display:'flex',gap:'6px',marginBottom:'10px'}},
      btn('📋 Liste',()=>{PMOD.arizaView='liste';render();},arView==='liste'?'#1e3a6e':'#e8eef7',arView==='liste'?'#fff':'#2a5080','7px 13px',{fontSize:'12px'}),
      btn('🗂 Kanban',()=>{PMOD.arizaView='kanban';render();},arView==='kanban'?'#1e3a6e':'#e8eef7',arView==='kanban'?'#fff':'#2a5080','7px 13px',{fontSize:'12px'})
    );
    const body = (!activeS.length)
      ? h('div',{style:{padding:'24px',textAlign:'center',color:T4,background:'#fff',borderRadius:'12px',border:'1px solid #d0daea'}},'Aktif arıza icrası yok.')
      : ((arView==='kanban' && !isMobSvc) ? renderArizaKanban(activeS, isAdminS)
          : h('div',{}, ...activeS.map(s=>arizaListRow(s,isAdminS))));
    return h('div',{style:{animation:'fu .3s ease'}}, headerRow, tabBar, infoNote, viewToggle, body);
  }

  // arTab==='tumu' → mevcut satış listesi (değişmedi)
  return h('div',{style:{animation:'fu .3s ease'}},
    headerRow, tabBar, infoNote,
    fyEmptyBanner('services','teknik servis'),
    svcFilterBox,
    isMobSvc ?
    h('div',{style:{display:'flex',flexDirection:'column',gap:'10px'}},
      svcFiltered.length ? svcFiltered.map(s=>{
        const c2=custById(s.customerId);
        return h('div',{style:{background:'#fff',border:'1px solid #b0c8e0',borderRadius:'13px',padding:'13px',boxShadow:'0 2px 6px rgba(20,40,80,.07)'}},
          h('div',{style:{fontWeight:'800',fontSize:'14px',color:'#0f1f35',marginBottom:'6px'}},s.jobName||''),
          h('div',{style:{display:'flex',flexWrap:'wrap',gap:'5px',marginBottom:'7px'}},
            s.status?badge(s.status,'#0891b2'):h('span'),
            c2?h('span',{style:{background:'#eff6ff',color:'#2563eb',padding:'3px 8px',borderRadius:'12px',fontSize:'11px',fontWeight:'600'}},c2.firmName):h('span'),
            s.preparedBy?h('span',{style:{background:'#f0fdf4',color:'#16a34a',padding:'3px 8px',borderRadius:'12px',fontSize:'11px'}},'👤 '+s.preparedBy):h('span')
          ),
          s.appointmentDate?h('div',{style:{fontSize:'11px',color:T3,marginBottom:'8px'}},'📅 Randevu: '+_toTR(s.appointmentDate)):h('span'),
          h('div',{style:{display:'flex',gap:'8px'}},
            btn('✏️ Düzenle',()=>setState({modal:{type:'service',item:s}}),'#e0f2fe','#0891b2','7px 14px',{fontSize:'12px',border:'1px solid #bae6fd',borderRadius:'7px',flex:'1'}),
            btn('🗑️',()=>delItem('services',s.id),'#fef2f2','#dc2626','7px 12px',{fontSize:'13px',border:'1px solid #fecaca',borderRadius:'7px'})
          )
        );
      }) : [h('div',{style:{padding:'32px',textAlign:'center',color:T4,background:G2,borderRadius:'12px'}},'Filtre sonucu yok.')]
    ) :
    makeScrollTable(thead, tbody, [160,150,120,130,110,110,110,110,110,130,110], !svcFiltered.length, 'Henüz teknik servis kaydı yok.')
  );
}
```

- [ ] **Step 3: `arizaAwaitingRow` ve `arizaListRow` yardımcılarını ekle**

`renderServices` fonksiyonunun kapanış `}` (yukarıdaki değişikliğin son satırı) hemen altına şu iki fonksiyonu ekle:

```javascript
function arizaAwaitingRow(s){
  const cust=(state.customers||[]).find(c=>c.id===s.customerId)||null;
  return h('div',{style:{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',display:'flex',flexWrap:'wrap',alignItems:'center',gap:'10px'}},
    h('div',{style:{flex:'1',minWidth:'160px'}},
      h('div',{style:{fontWeight:'700',color:'#0f2040'}},s.jobName||'(başlıksız)'),
      cust?h('div',{style:{fontSize:'12px',color:T3}},'👤 '+(cust.firmName||'')):h('span'),
      h('div',{style:{fontSize:'11px',color:T4}},'Durum: '+(s.status||'-'))
    ),
    btn('🔧 İcraya al',async()=>{await servStart(s); PMOD.arizaTab='aktif'; render();},'linear-gradient(135deg,#10b981,#059669)','#fff','8px 14px',{fontSize:'13px'})
  );
}
function arizaListRow(s, isAdmin){
  const st=servExecStage(s), meta=SERVICE_STAGE_META[st], open=servOpenCount(s, st);
  const cust=(state.customers||[]).find(c=>c.id===s.customerId)||null;
  const attn=servIsOverdue(s)||s.execUrgency==='acil';
  return h('div',{style:{background:'#fff',border:'1px solid '+(attn?'#fca5a5':'#d0daea'),borderRadius:'12px',padding:'12px 14px',marginBottom:'8px',cursor:'pointer',display:'flex',flexWrap:'wrap',alignItems:'center',gap:'10px'},onclick:()=>setState({modal:{type:'ariza',serviceId:s.id}})},
    h('div',{style:{flex:'1',minWidth:'160px'}},
      h('div',{style:{fontWeight:'700',color:'#0f2040',fontSize:'14px'}},(attn?'🔴 ':'')+(s.jobName||'(başlıksız)')),
      cust?h('div',{style:{fontSize:'12px',color:T3}},'👤 '+(cust.firmName||'')):h('span')
    ),
    (s.execUrgency==='acil')?h('span',{style:{background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:'20px',padding:'4px 10px',fontSize:'11px',fontWeight:'700'}},'ACİL'):h('span'),
    h('span',{style:{background:meta.color+'18',color:meta.color,border:'1px solid '+meta.color+'55',borderRadius:'20px',padding:'4px 10px',fontSize:'12px',fontWeight:'700'}},meta.icon+' '+meta.l),
    open?h('span',{style:{background:'#fef2f2',color:'#dc2626',borderRadius:'20px',padding:'4px 10px',fontSize:'12px',fontWeight:'700'}},open+' açık görev'):h('span',{style:{color:'#16a34a',fontSize:'12px',fontWeight:'700'}},'✓ temiz')
  );
}
```

- [ ] **Step 4: Syntax doğrula**

Ortak doğrulama komutunu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 5: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz3a): teknik servis icra sekmeleri + bekleyen/aktif/kapanan listeleri"
```

---

### Task 5: renderArizaKanban (aktif icra pano görünümü)

Faz 2 `renderProjeKanban` (satır 7033) desenini `services` için kopyala. 4 aşama kolonu; acil/geciken kartlar kırmızı kenarlıklı.

**Files:**
- Modify: `APRO_CRM_Firebase.html` (Task 4'te eklenen `arizaListRow` fonksiyonunun hemen altı)

- [ ] **Step 1: renderArizaKanban ekle**

`arizaListRow` fonksiyonunun kapanış `}` satırının hemen altına şunu ekle:

```javascript
function renderArizaKanban(list, isAdmin){
  const cols = SERVICE_STAGES.map(st=>{
    const meta=SERVICE_STAGE_META[st];
    const items=list.filter(s=>servExecStage(s)===st);
    return h('div',{style:{flex:'0 0 220px',minWidth:'220px',background:'#f4f7fb',border:'1px solid #d0daea',borderRadius:'12px',padding:'10px'}},
      h('div',{style:{fontWeight:'700',fontSize:'13px',color:meta.color,marginBottom:'8px',display:'flex',justifyContent:'space-between'}},
        h('span',{},meta.icon+' '+meta.l), h('span',{style:{color:T4}},String(items.length))),
      ...(items.length? items.map(s=>{
        const open=servOpenCount(s, st); const attn=servIsOverdue(s)||s.execUrgency==='acil';
        return h('div',{style:{background:'#fff',border:'1px solid '+(attn?'#fca5a5':'#d0daea'),borderRadius:'10px',padding:'9px 10px',marginBottom:'8px',cursor:'pointer'},onclick:()=>setState({modal:{type:'ariza',serviceId:s.id}})},
          h('div',{style:{fontWeight:'700',fontSize:'13px',color:'#0f2040'}},(attn?'🔴 ':'')+(s.jobName||'(başlıksız)')),
          open?h('div',{style:{fontSize:'11px',color:'#dc2626',marginTop:'4px',fontWeight:'700'}},open+' açık görev'):h('div',{style:{fontSize:'11px',color:'#16a34a',marginTop:'4px'}},'✓ temiz')
        );
      }) : [h('div',{style:{color:T4,fontSize:'12px',padding:'6px'}},'—')])
    );
  });
  return h('div',{style:{display:'flex',gap:'10px',overflowX:'auto',paddingBottom:'8px'}}, ...cols);
}
```

- [ ] **Step 2: Syntax doğrula**

Ortak doğrulama komutunu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 3: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz3a): aktif arıza kanban görünümü"
```

---

### Task 6: buildArizaModal + modal dispatch (aciliyet/hedef tarih R6, kapanış notu R7)

Faz 2 `buildProjeModal` (satır 7051) desenini `services` için kopyala. Ek olarak aciliyet seçici + hedef tarih (R6) ve kapanış notu gösterimi (R7). Modal dispatch'e `ariza` tipi eklenir.

**Files:**
- Modify: `APRO_CRM_Firebase.html` (Task 5'te eklenen `renderArizaKanban` fonksiyonunun hemen altı)
- Modify: `APRO_CRM_Firebase.html:7665` (modal dispatch)

- [ ] **Step 1: buildArizaModal ekle**

`renderArizaKanban` fonksiyonunun kapanış `}` satırının hemen altına şunu ekle:

```javascript
function buildArizaModal(serviceId){
  const cu=state.currentUser; const isAdmin=!!(cu&&cu.isAdmin); const myName=cu&&cu.displayName;
  const s=(state.services||[]).find(x=>x.id===serviceId);
  if(!s) return modal('Arıza', h('div',{},'Servis kaydı bulunamadı.'), ()=>setState({modal:null}), '640px');
  const st=servExecStage(s), idx=_servStageIndex(st), closed=!!s.execClosedAt;

  const strip=h('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'14px'}},
    ...SERVICE_STAGES.map((x,i)=>{
      const meta=SERVICE_STAGE_META[x];
      const state_ = i<idx?'done':(i===idx?'active':'todo');
      const bg = state_==='active'?meta.color:(state_==='done'?'#16a34a':'#e8eef7');
      const col = (state_==='active'||state_==='done')?'#fff':'#64748b';
      return h('span',{style:{background:bg,color:col,borderRadius:'20px',padding:'5px 11px',fontSize:'12px',fontWeight:'700'}},
        (state_==='done'?'✓ ':meta.icon+' ')+meta.l);
    })
  );

  const urgSel=sel([{v:'dusuk',l:'Düşük'},{v:'normal',l:'Normal'},{v:'acil',l:'Acil'}], s.execUrgency||'normal', async v=>{
    await personelSaveDoc('services', Object.assign({}, s, {execUrgency:v})); render();
  });
  const tgtInp=h('input',{type:'date',value:s.execTargetDate||'',style:{padding:'7px 10px',border:'1px solid #cbd5e1',borderRadius:'8px',fontSize:'12px'}});
  tgtInp.addEventListener('change',async e=>{ await personelSaveDoc('services', Object.assign({}, s, {execTargetDate:e.target.value})); render(); });
  const metaBar=h('div',{style:{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center',marginBottom:'12px'}},
    h('span',{style:{fontSize:'12px',color:T3,fontWeight:'700'}},'Aciliyet:'), urgSel,
    h('span',{style:{fontSize:'12px',color:T3,fontWeight:'700'}},'Hedef tarih:'), tgtInp,
    servIsOverdue(s)?h('span',{style:{background:'#fef2f2',color:'#dc2626',border:'1px solid #fecaca',borderRadius:'20px',padding:'3px 9px',fontSize:'11px',fontWeight:'700'}},'⏰ Hedef geçti'):h('span')
  );

  const acts=[];
  if(!closed && idx<SERVICE_STAGES.length-1) acts.push(btn('Sonraki aşama →',async()=>{await servAdvance(s); render();},'#1e3a6e','#fff','8px 14px',{fontSize:'13px'}));
  if(!closed && idx===SERVICE_STAGES.length-1) acts.push(btn('✓ Arızayı kapat',async()=>{await servClose(s); render();},'linear-gradient(135deg,#10b981,#059669)','#fff','8px 14px',{fontSize:'13px'}));
  if(isAdmin && closed) acts.push(btn('↺ Yeniden aç',async()=>{await servReopen(s); render();},'#fef3c7','#92400e','8px 14px',{fontSize:'13px'}));
  if(isAdmin && !closed && idx>0) acts.push(btn('← Geri al',async()=>{await servRollback(s); render();},'#fef3c7','#92400e','8px 14px',{fontSize:'13px'}));
  acts.push(btn('+ Bu aşamaya görev öner',async()=>{await suggestServStageTasks(s, st); render();},'#eef2ff','#4338ca','8px 14px',{fontSize:'13px'}));
  const actBar=h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'14px'}}, ...acts);

  const groups=SERVICE_STAGES.map(x=>{
    const ts=servStageTasks(s, x);
    if(!ts.length) return null;
    return h('div',{style:{marginBottom:'12px'}},
      h('div',{style:{fontWeight:'700',fontSize:'13px',color:SERVICE_STAGE_META[x].color,marginBottom:'6px'}},SERVICE_STAGE_META[x].icon+' '+SERVICE_STAGE_META[x].l),
      ...ts.map(t=>taskCard(t, isAdmin, myName))
    );
  }).filter(Boolean);
  const tasksBox = groups.length? h('div',{}, ...groups)
    : h('div',{style:{padding:'16px',textAlign:'center',color:T4}},'Bu arızaya bağlı görev yok. "Bu aşamaya görev öner" ile başlayın.');

  const cust=(state.customers||[]).find(c=>c.id===s.customerId)||null;
  const closeNote = (closed && s.execCloseNote) ? h('div',{style:{background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'10px',padding:'10px',marginBottom:'12px',fontSize:'12px',color:'#166534'}},'📝 Kapanış notu: '+s.execCloseNote) : h('span');
  const content=h('div',{},
    cust?h('div',{style:{fontSize:'13px',color:T3,marginBottom:'10px'}},'👤 '+(cust.firmName||'')):h('span'),
    strip, metaBar, actBar, closeNote,
    h('div',{style:{borderTop:'1px solid #e2e8f0',paddingTop:'12px'}}, tasksBox)
  );
  return modal((s.jobName||'Arıza')+' — İcra', content, ()=>setState({modal:null}), '720px');
}
```

- [ ] **Step 2: Modal dispatch'e `ariza` tipini ekle**

Şu satırı bul (7665):

```javascript
    else if(type==='proje') m=buildProjeModal(state.modal.oppId);
```

Hemen altına şunu ekle:

```javascript
    else if(type==='ariza') m=buildArizaModal(state.modal.serviceId);
```

- [ ] **Step 3: Syntax doğrula**

Ortak doğrulama komutunu çalıştır. Beklenen: `✅ SYNTAX OK`

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(faz3a): arıza icra modalı (aciliyet/hedef tarih + kapanış notu)"
```

---

## Manuel Doğrulama (tüm task'lar sonrası, tarayıcıda)

1. Teknik Servis → yeni servis, durum "Onaylandı" yap → **İcra bekleyen** sekmesinde görünür.
2. **🔧 İcraya al** → **Aktif** sekmesine geçer, "Talep" aşamasında; şablon görev önerisi confirm çıkar.
3. Kartı aç (modal) → **Sonraki aşama** ile planlama→müdahale→kapanış ilerlet; her aşamada görev önerisi.
4. Aciliyet **Acil** seç → liste/kanban'da kart 🔴 kırmızı kenarlık + "ACİL" rozeti.
5. Hedef tarihi geçmişe ayarla → "⏰ Hedef geçti" + kırmızı vurgu.
6. Kapanış aşamasında **Arızayı kapat** → not sorulur → **Kapanan** sekmesinde; modalda kapanış notu görünür.
7. Admin: kapananı **Yeniden aç**, aktifte **Geri al** çalışır; admin olmayan bu butonları görmez.
8. Servisi sil → bağlı `linkType:'service'` otomatik görevler temizlenir (Task 3).
9. **Tümü** sekmesi eski satış listesi/filtreler bozulmadan çalışır.

---

## Self-Review Notları (plan yazarı)

- **Spec kapsamı:** Model alanları (§3)→T1/T2; aşamalar R1 (§4)→T2; şablonlar (§5)→T2; tetik+bekleyen R3 (§6)→T2/T4; aciliyet R6 (§7)→T4/T6; fonksiyonlar (§8)→T2; UI R5 (§9)→T4/T5/T6; yetkiler (§10)→T6; cascade R4 (§11)→T3; kapanış notu R7→T2/T6. Tüm bölümler kapsandı.
- **Tip tutarlılığı:** `servExecStage/servIsActive/servIsAwaiting/servIsClosed/servIsOverdue`, `SERVICE_STAGES/SERVICE_STAGE_META/SERVICE_STAGE_TEMPLATES`, `servStart/servAdvance/servClose/servRollback/servReopen`, `servStageTasks/servOpenCount/_servStageIndex/suggestServStageTasks`, `arizaListRow/arizaAwaitingRow/renderArizaKanban/buildArizaModal`, modal tipi `ariza` + `serviceId` — tüm task'larda aynı.
- **Placeholder yok:** her kod adımı tam içerikli.
