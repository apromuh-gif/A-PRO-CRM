# Görev Motoru (Faz 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A-PRO CRM'in Personel modülündeki düz görev listesini; 3 bağlam (Şirket/Proje/Servis), durum akışı + koşullu onay/revizyon, kişiden kişiye devir, fiscalYear-bazlı prim entegrasyonu, şablon-tetiklemeli üretim ve cascade temizlik içeren profesyonel bir görev motoruna dönüştürmek.

**Architecture:** Tek dosya (`APRO_CRM_Firebase.html`), Vanilla JS + custom virtual-DOM (`h`, `btn`, `field`, `row`, `sel`, `inp`, `modal`), Firebase Firestore. Görev verisi geriye uyumlu genişletilir (migration yok, okuma-anında normalizasyon). Mevcut yardımcılar yeniden kullanılır: `saveDoc/deleteDoc`, `personelSaveDoc/personelDeleteDoc`, `showNotification`, `showToast`, `playBeep`, `genId`, `today`, `stamp`, `activeFiscalYear`, `filterFY`, `recFY`, `DEPT_LABEL`, `personelPeople`.

**Tech Stack:** HTML/CSS/Vanilla JS, Firebase Firestore, PWA. **Test framework yok.** Bu projenin doğrulama konvansiyonu: (1) her düzenlemeden sonra `node vm.Script` ile JS **syntax derleme testi** (CLAUDE.md), (2) tarayıcıda **elle işlevsel doğrulama**. Runtime unit test bu tek-dosya Firebase/DOM uygulamasında harness olmadan uygulanabilir değil; bu yüzden her task'ta otomatik kapı = syntax testi, artı somut elle doğrulama adımları verilir.

**Referans spec:** `docs/superpowers/specs/2026-07-30-gorev-motoru-design.md`

---

## Ön Bilgi: Syntax Test Komutu (her task'ta kullanılır)

Bu komut ana `<script>` bloğunu çıkarıp derler. Değişiklikten sonra çalıştır, `✅ SYNTAX OK` bekle:

```bash
cd "/Users/erkankaracakale/Desktop/CLAUDE-HAZIRLANAN PROJE DATABASE/A-PRO PLATFORM/A-PRO CRM FULL"
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

**Deploy YOK:** Hiçbir task deploy etmez. Deploy yalnızca kullanıcı açıkça "deploy" derse yapılır (`cp APRO_CRM_Firebase.html index.html && git add … && git push`).

---

## File Structure

Yalnızca **bir dosya** değişir: `APRO_CRM_Firebase.html`. Dokunulan bölgeler (satır no'ları güncel dosyaya göre yaklaşık; fonksiyon adıyla bul):

| Bölge | Sorumluluk | Task |
|---|---|---|
| Sabitler `~108-190` | `DEPARTMENTS`, `DEFAULT_EVAL_CONFIG`; yeni `TASK_*` sabitleri + `gorev_dogruluk` kriteri | 1, 5 |
| Altyapı `~742-780` | Yeni görev yardımcıları: `normTask`, `taskIsClosed`, `defaultNeedsApproval`, `TASK_STATUS_META`, cascade helper | 1, 6 |
| Yükleme `~1218` | `loadCollection('tasks')` sonrası normalizasyon | 1 |
| Prim `~5582-5601`, `~5676-5685` | `personelTaskStats/Punctual` fiscalYear-bazlı; `personelTaskDogruluk`; `gorev_dogruluk` metriği | 5 |
| Modal dispatch (`state.modal` switch) | `buildTaskModal` ekle | 2 |
| `renderPersonelGorevler` `~6408-6501` | Bağlam sekmeleri, Liste+Kanban, filtre, rol, kart→modal | 3, 7 |
| `personelAutoGenerateTasks` `~6188-6220` + tetik `~1150` | Kör üretim kaldır → şablon-tetiklemeli | 6 |
| Silme handler'ları: fırsat `~4851`, serviceOpps `~5047/5076`, teklif `~1395`, bakım | Cascade temizlik | 6 |

---

## Task 1: Sabitler, Yardımcılar ve Geriye Uyumlu Okuma Katmanı

**Files:**
- Modify: `APRO_CRM_Firebase.html` (sabitler bloğu `~190` sonrası; altyapı `~780` civarı; yükleme `~1218`)

- [ ] **Step 1: Görev sabitlerini ekle**

`DEFAULT_EVAL_CONFIG` tanımının hemen **sonrasına** (yaklaşık satır 190, `const eur =` satırından önce) ekle:

```javascript
// ═══ GÖREV MOTORU SABİTLERİ (Faz 1) ═══
const TASK_CONTEXTS = [
  { v:'sirket', l:'🏢 Şirket', c:'#b45309' },
  { v:'proje',  l:'📋 Proje',  c:'#1e3a6e' },
  { v:'servis', l:'🔧 Servis', c:'#0e7490' },
];
const TASK_CONTEXT_META = Object.fromEntries(TASK_CONTEXTS.map(x=>[x.v,x]));
// Durum akışı: yapilacak → devam ⇄ beklemede → tamamlandi → (onaylandi | revizyon→devam)
const TASK_STATUS_META = {
  yapilacak:   { l:'Yapılacak',    c:'#64748b', bg:'#f1f5f9' },
  devam:       { l:'Devam Ediyor', c:'#2563eb', bg:'#dbeafe' },
  beklemede:   { l:'Beklemede',    c:'#b45309', bg:'#fef3c7' },
  tamamlandi:  { l:'Tamamlandı',   c:'#0f766e', bg:'#ccfbf1' },
  onaylandi:   { l:'Onaylandı',    c:'#16a34a', bg:'#dcfce7' },
  revizyon:    { l:'Revizyon',     c:'#dc2626', bg:'#fee2e2' },
};
const TASK_KANBAN_COLUMNS = ['yapilacak','devam','beklemede','tamamlandi','onaylandi'];
const DEVIR_REASONS = [
  { v:'is_yuku',   l:'İş yükü dengeleme' },
  { v:'uzmanlik',  l:'Farklı uzmanlık gerekiyor' },
  { v:'performans',l:'Yetersiz performans' },
  { v:'yokluk',    l:'İzin / yokluk' },
  { v:'diger',     l:'Diğer' },
];
```

- [ ] **Step 2: Görev yardımcı fonksiyonlarını ekle**

Altyapı bölgesinde, `fyEmptyBanner` fonksiyonunun **hemen sonrasına** ekle (fonksiyonu bulmak için `grep -n "function fyEmptyBanner"`):

```javascript
// Eski (acik/tamam) → yeni durum akışına okuma-anında eşleme; yeni alanlara varsayılan.
function normTask(t){
  if(!t) return t;
  if(t._norm) return t;                      // idempotent
  const status = t.status==='acik' ? 'yapilacak'
               : t.status==='tamam' ? 'tamamlandi'
               : (t.status||'yapilacak');
  return Object.assign({}, t, {
    _norm:true,
    context: t.context || 'sirket',
    assignedBy: t.assignedBy || t.createdBy || '',
    linkType: t.linkType || t.linkedType || 'none',
    linkId: t.linkId || t.linkedId || '',
    linkLabel: t.linkLabel || '',
    status,
    needsApproval: t.needsApproval===true,
    dueTime: t.dueTime || '',
    startDate: t.startDate || '',
    approvedAt: t.approvedAt || null,
    approvedBy: t.approvedBy || '',
    revisionCount: Number(t.revisionCount)||0,
    assignmentHistory: Array.isArray(t.assignmentHistory)? t.assignmentHistory : [],
    comments: Array.isArray(t.comments)? t.comments : [],
  });
}
// "Kapalı" (iş bitti) sayılan durumlar: onaylandi her zaman; tamamlandi yalnız onay gerekmiyorsa.
function taskIsClosed(t){
  const s = (normTask(t)||{}).status;
  return s==='onaylandi' || (s==='tamamlandi' && !t.needsApproval);
}
// Akıllı onay varsayılanı: yüksek öncelik VEYA proje/servis bağlamı → true.
function defaultNeedsApproval(ctx, priority){
  return priority==='yuksek' || ctx==='proje' || ctx==='servis';
}
// Bir kayıt silinince bağlı autoGenerated görevleri de sil; manuel bağlıları döndür (çağıran sorar).
async function cascadeDeleteTasksFor(linkType, linkId){
  const bound = (state.tasks||[]).map(normTask).filter(t=>t.linkType===linkType && t.linkId===linkId);
  const autos = bound.filter(t=>t.autoGenerated);
  const manuals = bound.filter(t=>!t.autoGenerated);
  for(const t of autos){ await deleteDoc('tasks', t.id); }
  if(autos.length) setState({ tasks:(state.tasks||[]).filter(x=>!autos.some(a=>a.id===x.id)) });
  return { deletedAuto: autos.length, manuals };
}
```

- [ ] **Step 3: Yüklemede normalize et**

`loadCollection('tasks')` çağrısını bul (`grep -n "loadCollection('tasks')"`, ~1218). Görevlerin state'e yazıldığı yeri bulmak için `loadCollection` fonksiyonuna bak (`grep -n "function loadCollection"`). Firestore'dan gelen liste `setState`'e verilmeden önce `tasks` için normalize et. Eğer `loadCollection` jenerikse, en güvenli yol: yüklemeden hemen sonra tek seferlik normalize etmek. `loadCollection('tasks')`'in bulunduğu Promise.all bloğundan **sonra** (aynı async fonksiyon içinde) şu satırı ekle:

```javascript
if(Array.isArray(state.tasks)) setState({ tasks: state.tasks.map(normTask) });
```

Not: `grep -n "loadCollection('tasks')"` satırı ~1218'de `Promise.all([...])` içinde. O `await Promise.all(...)` ifadesinin hemen ardına yukarıdaki satırı koy.

- [ ] **Step 4: Syntax testi**

Ön Bilgi'deki komutu çalıştır.
Expected: `✅ SYNTAX OK`

- [ ] **Step 5: Tarayıcı doğrulaması**

`APRO_CRM_Firebase.html`'i tarayıcıda aç, giriş yap, Personel → Görevler'e git.
Expected: Mevcut görevler eskisi gibi listelenir (eski `acik`/`tamam` görevler hâlâ görünür), konsолda hata yok. (Görsel değişiklik henüz yok — bu task altyapı.)

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(gorev): görev motoru sabitleri + geriye uyumlu okuma katmanı"
```

---

## Task 2: Görev Detay/İşlem Modalı (durum, onay, devir, yorum)

**Files:**
- Modify: `APRO_CRM_Firebase.html` (modal dispatch switch; `renderPersonelGorevler` yakınına yeni fonksiyonlar)

Bu task görevin tüm yaşam döngüsü işlemlerini tek modalda toplar: durum ilerletme, tamamlama, onay/revizyon, devret, yorum ekleme. Kart tıklanınca açılır (kart entegrasyonu Task 3).

- [ ] **Step 1: Modal dispatch'e task tipini ekle**

Modal build switch'ini bul (`grep -n "type==='fiscalyear'"`). O `else if` zincirine ekle:

```javascript
      else if(type==='task') m=buildTaskModal(state.modal.taskId);
```

- [ ] **Step 2: Görev işlem yardımcılarını ekle**

`renderPersonelGorevler` fonksiyonundan **önce** ekle (`grep -n "function renderPersonelGorevler"`):

```javascript
function openTaskModal(taskId){ setState({ modal:{ type:'task', taskId } }); }

async function taskSetStatus(t, status){
  const rec = Object.assign({}, normTask(t), { status, ...stamp() });
  if(status==='tamamlandi') rec.completedAt = rec.completedAt || today();
  if(status!=='tamamlandi' && status!=='onaylandi') rec.completedAt = (status==='revizyon'? rec.completedAt : rec.completedAt);
  await personelSaveDoc('tasks', rec);
  const who = state.currentUser && state.currentUser.displayName;
  if(status==='tamamlandi' && rec.needsApproval){
    showNotification('task_done_'+rec.id, 'Onay bekliyor', (rec.title||'Görev')+' tamamlandı, onayınızı bekliyor.', 'info', rec.assignedBy);
  }
  showToast('✅ Durum güncellendi: '+(TASK_STATUS_META[status]?TASK_STATUS_META[status].l:status));
}

async function taskApprove(t){
  const who = (state.currentUser && state.currentUser.displayName)||'';
  const rec = Object.assign({}, normTask(t), { status:'onaylandi', approvedAt:today(), approvedBy:who, completedAt: t.completedAt||today(), ...stamp() });
  await personelSaveDoc('tasks', rec);
  showNotification('task_ok_'+rec.id, '✅ Görev onaylandı', (rec.title||'Görev')+' onaylandı.', 'win', rec.assignedTo);
  playBeep('win');
  showToast('✅ Görev onaylandı.');
}

async function taskRevise(t){
  const note = prompt('Revizyon nedeni (zorunlu — neyin düzeltileceğini yazın):');
  if(!note || !note.trim()){ showToast('⚠ Revizyon için açıklama zorunlu.','#dc2626'); return; }
  const who = (state.currentUser && state.currentUser.displayName)||'';
  const base = normTask(t);
  const comments = base.comments.concat([{ by:who, text:'↩ Revizyon: '+note.trim(), at:today() }]);
  const rec = Object.assign({}, base, { status:'devam', revisionCount:(base.revisionCount||0)+1, comments, ...stamp() });
  await personelSaveDoc('tasks', rec);
  showNotification('task_rev_'+rec.id, '↩ Revizyona döndü', (rec.title||'Görev')+' revizyona gönderildi.', 'warning', rec.assignedTo);
  playBeep('warning');
  showToast('↩ Revizyona gönderildi.');
}

async function taskReassign(t, toName, reason, note, newDue){
  const who = (state.currentUser && state.currentUser.displayName)||'';
  const person = personelPeople().find(u=>u.displayName===toName);
  const base = normTask(t);
  const hist = base.assignmentHistory.concat([{ from:base.assignedTo, to:toName, at:today(), by:who, reason:reason||'diger', note:note||'' }]);
  const comments = base.comments.concat([{ by:who, text:'↪ Devredildi → '+toName+(reason?(' ('+(DEVIR_REASONS.find(r=>r.v===reason)||{}).l+')'):'' )+(note?': '+note:''), at:today() }]);
  const rec = Object.assign({}, base, {
    assignedTo: toName, department: person? person.department : base.department,
    assignmentHistory: hist, comments,
    dueDate: newDue || base.dueDate, ...stamp()
  });
  await personelSaveDoc('tasks', rec);
  showNotification('task_reassign_'+rec.id, '↪ Yeni görev', (rec.title||'Görev')+' size devredildi.', 'info', toName);
  playBeep('info');
  showToast('↪ Devredildi: '+toName);
}

async function taskAddComment(t, text){
  if(!text || !text.trim()) return;
  const who = (state.currentUser && state.currentUser.displayName)||'';
  const base = normTask(t);
  const comments = base.comments.concat([{ by:who, text:text.trim(), at:today() }]);
  const rec = Object.assign({}, base, { comments, ...stamp() });
  await personelSaveDoc('tasks', rec);
  const other = who===base.assignedTo ? base.assignedBy : base.assignedTo;
  if(other) showNotification('task_cmt_'+rec.id, '💬 Yorum', (rec.title||'Görev')+' için yeni yorum.', 'info', other);
}
```

- [ ] **Step 3: `buildTaskModal` fonksiyonunu ekle**

Yukarıdaki yardımcıların hemen ardına ekle. Mevcut `modal(title, content, onClose, maxWidth)` yardımcısını kullanır:

```javascript
function buildTaskModal(taskId){
  const t = normTask((state.tasks||[]).find(x=>x.id===taskId));
  if(!t) return modal('Görev', h('div',{style:{padding:'16px'}},'Görev bulunamadı.'), ()=>setState({modal:null}));
  const cu = state.currentUser || {};
  const isAdmin = cu.role==='admin' || cu.role==='yonetici';
  const myName = cu.displayName;
  const isOwner = t.assignedTo===myName;          // atanan personel
  const isGiver = t.assignedBy===myName || isAdmin; // görevi veren / yönetici
  const sm = TASK_STATUS_META[t.status] || TASK_STATUS_META.yapilacak;
  const cm = TASK_CONTEXT_META[t.context] || TASK_CONTEXT_META.sirket;

  // Durum ilerletme butonları (atanan personel)
  const flow = { yapilacak:'devam', devam:'tamamlandi', beklemede:'devam' };
  const ownerBtns = [];
  if(isOwner && !taskIsClosed(t)){
    if(t.status==='yapilacak') ownerBtns.push(btn('▶ Başla',()=>taskSetStatus(t,'devam'),'#2563eb','#fff','8px 14px'));
    if(t.status==='devam'){
      ownerBtns.push(btn('✓ Tamamladım',()=>taskSetStatus(t,'tamamlandi'),'linear-gradient(135deg,#10b981,#059669)','#fff','8px 14px'));
      ownerBtns.push(btn('⏸ Beklet',()=>taskSetStatus(t,'beklemede'),'#fef3c7','#b45309','8px 14px'));
    }
    if(t.status==='beklemede') ownerBtns.push(btn('▶ Devam',()=>taskSetStatus(t,'devam'),'#2563eb','#fff','8px 14px'));
  }

  // Onay/Revizyon (görevi veren/yönetici) — tamamlandı + onay gerekiyorsa
  const approveBtns = [];
  if(isGiver && t.status==='tamamlandi' && t.needsApproval){
    approveBtns.push(btn('✅ Onayla',()=>taskApprove(t),'linear-gradient(135deg,#16a34a,#15803d)','#fff','8px 14px'));
    approveBtns.push(btn('↩ Revizyon',()=>taskRevise(t),'#fee2e2','#dc2626','8px 14px'));
  }

  // Devret (görevi veren/yönetici) — aynı departman varsayılan filtre
  let devretPanel = h('span');
  if(isGiver && !taskIsClosed(t)){
    const d = state._devretDraft || (state._devretDraft = { to:'', reason:'is_yuku', note:'', newDue:t.dueDate||'', wide:false });
    const pool = personelPeople().filter(u=> state._devretDraft.wide ? true : (u.department===t.department));
    const opts = [{v:'',l:'— Kişi seçin —'}, ...pool.filter(u=>u.displayName!==t.assignedTo).map(u=>({v:u.displayName,l:u.displayName+' ('+(DEPT_LABEL[u.department]||'')+')'}))];
    devretPanel = h('div',{style:{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'12px',marginTop:'10px'}},
      h('div',{style:{fontWeight:'700',fontSize:'12px',color:'#0f1f35',marginBottom:'8px'}},'↪ Devret'),
      row(
        field('Kime', sel(opts, d.to, v=>{d.to=v;}), true),
        field('Sebep', sel(DEVIR_REASONS.map(r=>({v:r.v,l:r.l})), d.reason, v=>{d.reason=v;}), true)
      ),
      row(
        field('Yeni bitiş (ops.)', inp('', d.newDue, v=>{d.newDue=v;}, 'date'), true),
        field('Not (ops.)', inp('', d.note, v=>{d.note=v;}), true)
      ),
      h('div',{style:{display:'flex',gap:'8px',alignItems:'center',marginTop:'6px'}},
        btn(d.wide?'◱ Sadece departman':'◲ Tüm ekip',()=>{d.wide=!d.wide;render();},'#e8eef7','#2a5080','7px 12px',{fontSize:'11px'}),
        btn('↪ Devret',()=>{ if(!d.to){showToast('⚠ Kişi seçin.','#dc2626');return;} taskReassign(t,d.to,d.reason,d.note,d.newDue).then(()=>{state._devretDraft=null;setState({modal:null});}); },'#1e3a6e','#fff','8px 14px',{flex:'1'})
      )
    );
  }

  // Yorum akışı
  const commentList = (t.comments||[]).map(c=>h('div',{style:{fontSize:'12px',color:'#334155',padding:'6px 0',borderBottom:'1px solid #f1f5f9'}},
    h('span',{style:{fontWeight:'700'}},(c.by||'-')+' · '),
    h('span',{style:{color:'#94a3b8'}},_toTR(c.at)+' — '),
    c.text));
  const cDraft = state._commentDraft || (state._commentDraft={text:''});
  const commentBox = h('div',{style:{marginTop:'12px'}},
    h('div',{style:{fontWeight:'700',fontSize:'12px',color:'#0f1f35',marginBottom:'6px'}},'💬 Yorumlar'),
    ...(commentList.length?commentList:[h('div',{style:{fontSize:'12px',color:'#94a3b8'}},'Henüz yorum yok.')]),
    h('div',{style:{display:'flex',gap:'6px',marginTop:'8px'}},
      inp('Yorum ekle…', cDraft.text, v=>{cDraft.text=v;}),
      btn('Gönder',()=>{ taskAddComment(t,cDraft.text).then(()=>{state._commentDraft=null;render();}); },'#2563eb','#fff','8px 14px')
    )
  );

  // Devir geçmişi
  const histList = (t.assignmentHistory||[]).length ? h('div',{style:{marginTop:'10px',fontSize:'11px',color:'#64748b'}},
    h('div',{style:{fontWeight:'700',marginBottom:'4px',color:'#0f1f35'}},'↪ Devir geçmişi'),
    ...(t.assignmentHistory.map(hh=>h('div',{},_toTR(hh.at)+': '+(hh.from||'-')+' → '+hh.to+(hh.reason?' ('+((DEVIR_REASONS.find(r=>r.v===hh.reason)||{}).l||hh.reason)+')':''))))
  ) : h('span');

  const meta = h('div',{style:{fontSize:'12px',color:'#475569',lineHeight:'1.7'}},
    h('div',{},h('b',{},'Atanan: '),(t.assignedTo||'-')+(t.department?' · '+(DEPT_LABEL[t.department]||''):'')),
    h('div',{},h('b',{},'Veren: '),(t.assignedBy||'-')),
    h('div',{},h('b',{},'Bitiş: '),(t.dueDate?_toTR(t.dueDate):'-')+(t.dueTime?' '+t.dueTime:'')),
    t.linkId?h('div',{},h('b',{},'Bağlı: '),(t.linkLabel||t.linkType)) : h('span'),
    t.revisionCount?h('div',{style:{color:'#dc2626'}},h('b',{},'Revizyon: '),String(t.revisionCount)+' kez') : h('span')
  );

  const content = h('div',{style:{padding:'16px',maxHeight:'70vh',overflowY:'auto'}},
    h('div',{style:{display:'flex',gap:'8px',alignItems:'center',flexWrap:'wrap',marginBottom:'8px'}},
      h('span',{style:{background:cm.c+'22',color:cm.c,fontSize:'11px',fontWeight:'700',padding:'3px 9px',borderRadius:'9px'}},cm.l),
      h('span',{style:{background:sm.bg,color:sm.c,fontSize:'11px',fontWeight:'700',padding:'3px 9px',borderRadius:'9px'}},sm.l),
      t.needsApproval?h('span',{style:{background:'#ede9fe',color:'#6d28d9',fontSize:'11px',fontWeight:'700',padding:'3px 9px',borderRadius:'9px'}},'✔ Onay gerekir'):h('span')
    ),
    h('div',{style:{fontWeight:'800',fontSize:'16px',color:'#0f1f35',marginBottom:'4px'}},t.title||'Görev'),
    t.desc?h('div',{style:{fontSize:'13px',color:'#475569',marginBottom:'10px'}},t.desc):h('span'),
    meta,
    (ownerBtns.length||approveBtns.length)?h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'12px'}}, ...ownerBtns, ...approveBtns):h('span'),
    devretPanel,
    histList,
    commentBox
  );
  return modal(t.title||'Görev', content, ()=>{ state._devretDraft=null; state._commentDraft=null; setState({modal:null}); }, '560px');
}
```

- [ ] **Step 4: Syntax testi**

Ön Bilgi komutu. Expected: `✅ SYNTAX OK`

- [ ] **Step 5: Tarayıcı doğrulaması (geçici tetik)**

Modal henüz karttan açılmıyor (Task 3'te bağlanacak). Geçici test: tarayıcı konsolunda `openTaskModal(state.tasks[0].id)` çağır.
Expected: Modal açılır; başlık, durum/bağlam rozetleri, "Başla/Tamamladım" akış butonları (kendine atanmışsa), devret paneli (yönetici/veren isen), yorum kutusu görünür. Yorum ekle → liste güncellenir.

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(gorev): görev detay modalı — durum akışı, onay/revizyon, devir, yorum"
```

---

## Task 3: Görevler Ekranı — Bağlam Sekmeleri, Liste + Kanban, Filtreler

**Files:**
- Modify: `APRO_CRM_Firebase.html` — `renderPersonelGorevler` (`~6408-6501`) tam yeniden yazımı; state'e görünüm alanları

- [ ] **Step 1: Görev görünüm state alanlarını ekle**

`PMOD` tanımını bul (`grep -n "let PMOD ="`, ~686). Alanları ekle:

```javascript
let PMOD = { taskFilter:'acik', taskAdd:false, draft:null, perfOpen:{}, primOpen:{}, settingsOpen:false, taskCtx:'hepsi', taskView:'liste', taskDept:'', taskPerson:'' };
```

- [ ] **Step 2: `renderPersonelGorevler`'i yeniden yaz**

Mevcut `renderPersonelGorevler(period, isAdmin, cu){ … }` fonksiyonunun **tamamını** aşağıdakiyle değiştir (fonksiyon gövdesini `grep -n "function renderPersonelGorevler"` → kapanış `}` ile bul; `return h('div',{}, fyEmptyBanner('tasks','görev'), …)` satırında biter):

```javascript
function renderPersonelGorevler(period, isAdmin, cu){
  const myName = cu && cu.displayName;
  let list = filterFY(state.tasks, activeFiscalYear()).map(normTask);
  if(!isAdmin) list = list.filter(t=>t.assignedTo===myName || t.assignedBy===myName);

  // Bağlam sekmeleri
  const ctxTabs = [{v:'hepsi',l:'👁 Tümü'},{v:'bana',l:'⭐ Bana Atananlar'}, ...TASK_CONTEXTS.map(c=>({v:c.v,l:c.l}))];
  const ctx = PMOD.taskCtx||'hepsi';
  const ctxBar = h('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}},
    ...ctxTabs.map(tb=>btn(tb.l,()=>{PMOD.taskCtx=tb.v;render();},ctx===tb.v?'#1e3a6e':'#e8eef7',ctx===tb.v?'#fff':'#2a5080','7px 12px',{fontSize:'12px',border:'1px solid #b8c8de'}))
  );

  // Bağlam filtresi uygula
  if(ctx==='bana') list = list.filter(t=>t.assignedTo===myName);
  else if(ctx!=='hepsi') list = list.filter(t=>t.context===ctx);

  // Durum filtresi (chip)
  const f = PMOD.taskFilter;
  const statusFilter = t => {
    if(f==='acik') return !taskIsClosed(t);
    if(f==='geciken') return !taskIsClosed(t) && t.dueDate && String(t.dueDate)<today();
    if(f==='onay') return t.status==='tamamlandi' && t.needsApproval;
    if(f==='tamam') return taskIsClosed(t);
    return true;
  };

  // Departman filtresi (yönetici)
  if(isAdmin && PMOD.taskDept) list = list.filter(t=>t.department===PMOD.taskDept);
  if(isAdmin && PMOD.taskPerson) list = list.filter(t=>t.assignedTo===PMOD.taskPerson);

  const chips = [['acik','Açık'],['geciken','Geciken'],['onay','Onay Bekleyen'],['tamam','Kapalı'],['hepsi','Hepsi']];
  const filterBar = h('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}},
    ...chips.map(([id,lb])=>btn(lb,()=>{PMOD.taskFilter=id;render();},f===id?'#1e3a6e':'#e8eef7',f===id?'#fff':'#2a5080','7px 13px',{fontSize:'12px',border:'1px solid #b8c8de'}))
  );

  // Yönetici departman/kişi filtresi + görünüm anahtarı
  let mgrBar = h('span');
  if(isAdmin){
    const deptOpts=[{v:'',l:'Tüm departmanlar'},...DEPARTMENTS.map(d=>({v:d.v,l:d.l}))];
    const perOpts=[{v:'',l:'Tüm kişiler'},...personelPeople().map(u=>({v:u.displayName,l:u.displayName}))];
    mgrBar = h('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px',alignItems:'center'}},
      sel(deptOpts, PMOD.taskDept, v=>{PMOD.taskDept=v;render();}),
      sel(perOpts, PMOD.taskPerson, v=>{PMOD.taskPerson=v;render();})
    );
  }
  const viewBar = h('div',{style:{display:'flex',gap:'6px',marginBottom:'12px'}},
    btn('📋 Liste',()=>{PMOD.taskView='liste';render();},PMOD.taskView==='liste'?'#1e3a6e':'#e8eef7',PMOD.taskView==='liste'?'#fff':'#2a5080','7px 13px',{fontSize:'12px'}),
    btn('🗂 Kanban',()=>{PMOD.taskView='kanban';render();},PMOD.taskView==='kanban'?'#1e3a6e':'#e8eef7',PMOD.taskView==='kanban'?'#fff':'#2a5080','7px 13px',{fontSize:'12px'})
  );

  const addBtn = btn('+ Görev Ekle',()=>{
    PMOD.taskAdd=true;
    PMOD.draft={ title:'', desc:'', assignedTo: isAdmin?'':myName, dueDate:'', dueTime:'', priority:'orta', context:(ctx==='proje'||ctx==='servis')?ctx:'sirket', needsApproval:null };
    render();
  },'linear-gradient(135deg,#10b981,#059669)','#fff','9px 16px',{fontSize:'13px',marginBottom:'12px'});

  const addPanel = PMOD.taskAdd ? renderTaskAddPanel(isAdmin, myName) : h('span');

  const filtered = list.filter(statusFilter).sort((a,b)=>String(a.dueDate||'').localeCompare(String(b.dueDate||'')));

  const body = PMOD.taskView==='kanban'
    ? renderTaskKanban(filtered)
    : h('div',{}, ...(filtered.length? filtered.map(t=>taskCard(t,isAdmin,myName)) : [h('div',{style:{padding:'28px',textAlign:'center',color:T4,background:'#ffffff',borderRadius:'12px',border:'1px solid #d0daea'}},'Bu filtrede görev yok.')]));

  return h('div',{}, fyEmptyBanner('tasks','görev'), addBtn, addPanel, ctxBar, mgrBar, filterBar, viewBar, body);
}
```

- [ ] **Step 3: Yardımcı render fonksiyonlarını ekle**

`renderPersonelGorevler`'in **hemen ardına** ekle:

```javascript
function renderTaskAddPanel(isAdmin, myName){
  const d = PMOD.draft;
  const people = personelPeople();
  const assignOpts = [{v:'',l:'— Kişi seçin —'}, ...people.map(u=>({v:u.displayName,l:u.displayName+' ('+(DEPT_LABEL[u.department]||'')+')'}))];
  const assignEl = isAdmin ? sel(assignOpts, d.assignedTo, v=>d.assignedTo=v) : inp('', myName, ()=>{}, 'text', {background:'#e2e8f0'});
  if(!isAdmin){ assignEl.disabled=true; d.assignedTo=myName; }
  const ctxOpts = TASK_CONTEXTS.map(c=>({v:c.v,l:c.l}));
  const effApproval = d.needsApproval==null ? defaultNeedsApproval(d.context,d.priority) : d.needsApproval;
  return h('div',{style:{background:'#ffffff',border:'1px solid #6366f1',borderRadius:'12px',padding:'16px',marginBottom:'14px'}},
    h('div',{style:{fontWeight:'700',fontSize:'13px',color:'#4338ca',marginBottom:'10px'}},'📝 Yeni Görev'),
    field('Başlık *', inp('Görev başlığı', d.title, v=>d.title=v)),
    row(
      field('Bağlam', sel(ctxOpts, d.context, v=>{d.context=v;render();}), true),
      field('Atanan', assignEl, true)
    ),
    row(
      field('Bitiş Tarihi', inp('', d.dueDate, v=>d.dueDate=v, 'date'), true),
      field('Bitiş Saati (ops.)', inp('', d.dueTime, v=>d.dueTime=v, 'time'), true)
    ),
    row(
      field('Öncelik', sel([{v:'dusuk',l:'Düşük'},{v:'orta',l:'Orta'},{v:'yuksek',l:'Yüksek'}], d.priority, v=>{d.priority=v;render();}), true),
      field('Onay gereksin mi?', sel([{v:'auto',l:'Otomatik ('+(effApproval?'Evet':'Hayır')+')'},{v:'evet',l:'Evet'},{v:'hayir',l:'Hayır'}], d.needsApproval==null?'auto':(d.needsApproval?'evet':'hayir'), v=>{ d.needsApproval = v==='auto'?null:(v==='evet'); }), true)
    ),
    field('Açıklama', inp('Detay (opsiyonel)', d.desc, v=>d.desc=v)),
    h('div',{style:{display:'flex',gap:'8px',marginTop:'6px'}},
      btn('✓ Kaydet', async()=>{
        if(!d.title || !d.assignedTo){ showToast('⚠ Başlık ve atanan zorunlu.','#dc2626'); return; }
        const person = people.find(u=>u.displayName===d.assignedTo);
        const na = d.needsApproval==null ? defaultNeedsApproval(d.context,d.priority) : d.needsApproval;
        const rec = normTask({
          id: genId(), title:d.title.trim(), desc:d.desc||'',
          assignedTo:d.assignedTo, department: person?person.department:'',
          assignedBy:(state.currentUser&&state.currentUser.displayName)||'',
          context:d.context||'sirket', linkType:'none', linkId:'', linkLabel:'',
          dueDate:d.dueDate||'', dueTime:d.dueTime||'', startDate:'',
          status:'yapilacak', completedAt:null, priority:d.priority||'orta',
          needsApproval:na, revisionCount:0, assignmentHistory:[], comments:[],
          autoGenerated:false, createdBy:(state.currentUser&&state.currentUser.displayName)||'', createdAt:today(), fiscalYear: activeFiscalYear()
        });
        await personelSaveDoc('tasks', rec);
        if(rec.assignedTo!==((state.currentUser&&state.currentUser.displayName)||'')) showNotification('task_new_'+rec.id,'Yeni görev',(rec.title)+' size atandı.','info',rec.assignedTo);
        PMOD.taskAdd=false; PMOD.draft=null; showToast('✅ Görev eklendi.');
      },'linear-gradient(135deg,#10b981,#059669)','#fff','9px 16px',{flex:'1'}),
      btn('İptal',()=>{PMOD.taskAdd=false;PMOD.draft=null;render();},'#e8eef7','#4a6080','9px 14px')
    )
  );
}

function taskCard(t, isAdmin, myName){
  const overdue = !taskIsClosed(t) && t.dueDate && String(t.dueDate)<today();
  const closed = taskIsClosed(t);
  const canDel = isAdmin || t.createdBy===myName || t.assignedBy===myName;
  const PRIO = { dusuk:['Düşük','#64748b'], orta:['Orta','#d97706'], yuksek:['Yüksek','#dc2626'] };
  const pr = PRIO[t.priority]||PRIO.orta;
  const sm = TASK_STATUS_META[t.status]||TASK_STATUS_META.yapilacak;
  const cm = TASK_CONTEXT_META[t.context]||TASK_CONTEXT_META.sirket;
  const cardEl = h('div',{style:{background:'#ffffff',border:'1px solid '+(overdue?'#fca5a5':closed?'#bbf7d0':'#d0daea'),borderRadius:'11px',padding:'12px 14px',marginBottom:'8px',cursor:'pointer'}},
    h('div',{style:{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}},
      h('span',{style:{background:cm.c+'22',color:cm.c,fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'9px'}},cm.l),
      h('span',{style:{background:sm.bg,color:sm.c,fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'9px'}},sm.l),
      h('span',{style:{fontWeight:'700',fontSize:'14px',color:closed?'#94a3b8':'#0f1f35',textDecoration:closed?'line-through':'none'}},t.title),
      h('span',{style:{background:pr[1]+'22',color:pr[1],fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'9px'}},pr[0]),
      t.needsApproval?h('span',{style:{background:'#ede9fe',color:'#6d28d9',fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'9px'}},'✔ onay'):h('span'),
      t.autoGenerated?h('span',{style:{background:'#e0e7ff',color:'#4338ca',fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'9px'}},'⚙ şablon'):h('span'),
      overdue?h('span',{style:{background:'#fee2e2',color:'#dc2626',fontSize:'10px',fontWeight:'700',padding:'2px 7px',borderRadius:'9px'}},'GECİKEN'):h('span'),
      (t.assignmentHistory&&t.assignmentHistory.length)?h('span',{style:{fontSize:'10px',color:'#64748b'}},'↪'+t.assignmentHistory.length):h('span'),
      (t.comments&&t.comments.length)?h('span',{style:{fontSize:'10px',color:'#64748b'}},'💬'+t.comments.length):h('span')
    ),
    t.desc?h('div',{style:{fontSize:'12px',color:T3,marginTop:'4px'}},t.desc):h('span'),
    h('div',{style:{fontSize:'11px',color:T4,marginTop:'5px'}},'👤 '+(t.assignedTo||'-')+(t.department?' · '+(DEPT_LABEL[t.department]||''):'')+(t.dueDate?' · 📅 '+_toTR(t.dueDate)+(t.dueTime?' '+t.dueTime:''):''))
  );
  cardEl.addEventListener('click',()=>openTaskModal(t.id));
  return h('div',{style:{display:'flex',gap:'8px',alignItems:'flex-start'}},
    h('div',{style:{flex:'1',minWidth:'0'}}, cardEl),
    canDel?btn('🗑️',(e)=>{ if(confirm('Görev silinsin mi?')) personelDeleteDoc('tasks',t.id).then(()=>showToast('✅ Silindi.')); },'#fef2f2','#dc2626','6px 10px',{fontSize:'12px',border:'1px solid #fecaca',flexShrink:'0',marginTop:'4px'}):h('span')
  );
}

function renderTaskKanban(tasks){
  const cols = TASK_KANBAN_COLUMNS.map(st=>{
    const sm = TASK_STATUS_META[st];
    const items = tasks.filter(t=>{
      if(st==='onaylandi') return t.status==='onaylandi';
      if(st==='tamamlandi') return t.status==='tamamlandi';
      return t.status===st;
    });
    return h('div',{style:{minWidth:'220px',flex:'1',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:'10px',padding:'10px'}},
      h('div',{style:{fontWeight:'700',fontSize:'12px',color:sm.c,marginBottom:'8px'}},sm.l+' ('+items.length+')'),
      ...(items.length? items.map(t=>{
        const card = h('div',{style:{background:'#fff',border:'1px solid #d0daea',borderRadius:'8px',padding:'8px 10px',marginBottom:'6px',cursor:'pointer',fontSize:'12px'}},
          h('div',{style:{fontWeight:'700',color:'#0f1f35'}},t.title),
          h('div',{style:{color:'#64748b',marginTop:'3px'}},'👤 '+(t.assignedTo||'-')+(t.dueDate?' · '+_toTR(t.dueDate):''))
        );
        card.addEventListener('click',()=>openTaskModal(t.id));
        return card;
      }) : [h('div',{style:{fontSize:'11px',color:'#94a3b8'}},'—')])
    );
  });
  return h('div',{style:{display:'flex',gap:'10px',overflowX:'auto',paddingBottom:'8px'}}, ...cols);
}
```

- [ ] **Step 4: Syntax testi**

Ön Bilgi komutu. Expected: `✅ SYNTAX OK`

- [ ] **Step 5: Tarayıcı doğrulaması**

Personel → Görevler:
Expected:
- Üstte bağlam sekmeleri (Tümü / Bana Atananlar / Şirket / Proje / Servis) çalışır.
- Liste ⇄ Kanban geçişi çalışır; Kanban kolonları durumlara göre dolar.
- Karta tıklayınca Task 2 modalı açılır.
- Yönetici olarak departman + kişi filtreleri listeyi daraltır.
- "+ Görev Ekle" → bağlam, saat, "onay gereksin mi?" alanları görünür; kaydet çalışır; atanana bildirim gider.

- [ ] **Step 6: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(gorev): görevler ekranı — bağlam sekmeleri, liste+kanban, filtreler, kart→modal"
```

---

## Task 4: Bildirimler (gecikme + günlük tetik)

**Files:**
- Modify: `APRO_CRM_Firebase.html` — auto-gen tetik bölgesi (`~1150`) yakınına gecikme kontrolü

Not: Atama/devir/tamamla/onay/revizyon/yorum bildirimleri Task 2-3'te zaten bağlandı. Bu task yalnızca **zaman-bazlı** bildirimleri (bugün/gecikme) ekler.

- [ ] **Step 1: Gecikme/bugün bildirim tarayıcısını ekle**

`personelAutoGenerateTasks(); // fire-and-forget` çağrısının bulunduğu bölgeyi bul (`grep -n "personelAutoGenerateTasks()"`, ~1150). Aynı yere şu çağrıyı ekle:

```javascript
    taskDueReminders(); // fire-and-forget, günde bir kez bildirir
```

Ardından `personelAutoGenerateTasks` fonksiyonunun yanına şu fonksiyonu ekle:

```javascript
// Bugün biten / geciken açık görevler için günde bir kez bildirim (localStorage anti-spam).
function taskDueReminders(){
  try{
    const key='taskRemind_'+today();
    if(localStorage.getItem(key)) return;
    const my=(state.currentUser&&state.currentUser.displayName)||'';
    if(!my) return;
    const mine=(state.tasks||[]).map(normTask).filter(t=>t.assignedTo===my && !taskIsClosed(t) && t.dueDate);
    const overdue=mine.filter(t=>String(t.dueDate)<today());
    const dueToday=mine.filter(t=>String(t.dueDate)===today());
    if(overdue.length) showNotification('task_overdue_'+today(),'⏰ Geciken görev',overdue.length+' göreviniz gecikti.','urgent',my);
    else if(dueToday.length) showNotification('task_today_'+today(),'📅 Bugün biten görev',dueToday.length+' göreviniz bugün bitiyor.','warning',my);
    localStorage.setItem(key,'1');
  }catch(e){}
}
```

- [ ] **Step 2: Syntax testi** — Ön Bilgi komutu. Expected: `✅ SYNTAX OK`

- [ ] **Step 3: Tarayıcı doğrulaması**

Kendine bugün/geçmiş vadeli açık bir görev ata, sayfayı yenile.
Expected: Geciken varsa "⏰ Geciken görev", yoksa bugün biten varsa "📅 Bugün biten görev" bildirimi bir kez düşer; ikinci yenilemede tekrar düşmez (aynı gün).

- [ ] **Step 4: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(gorev): gecikme/bugün görev hatırlatma bildirimleri"
```

---

## Task 5: Prim Entegrasyonu (fiscalYear-bazlı + doğruluk + performans devir cezası)

**Files:**
- Modify: `APRO_CRM_Firebase.html` — `personelTaskStats`/`personelTaskPunctual` (`~5582-5601`), yeni `personelTaskDogruluk`, `personelAutoMetric` `gorev` bloğu (`~5676-5685`), `DEFAULT_EVAL_CONFIG` (`~126-190`)

- [ ] **Step 1: `personelTaskStats`'i fiscalYear-bazlı + performans cezalı yap**

Mevcut `personelTaskStats` fonksiyonunu (`grep -n "function personelTaskStats"`) tümüyle değiştir:

```javascript
function personelTaskStats(name, period, ytd){
  const win = ytd ? _pYtdInPeriod : _pInPeriod;
  const fy = _periodYear(period);
  const ts = (state.tasks||[]).map(normTask)
    .filter(t=>recFY(t)===fy && t.assignedTo===name && (win(t.dueDate,period)||win(t.completedAt,period)));
  const total = ts.length;
  const done = ts.filter(t=>taskIsClosed(t)).length;
  // Performans sebebiyle bu kişinin elinden alınmış görevler → negatif sinyal
  const takenAway = (state.tasks||[]).map(normTask).filter(t=>recFY(t)===fy &&
    (t.assignmentHistory||[]).some(h=>h.from===name && h.reason==='performans')).length;
  const denom = total + takenAway;
  return { total, done, takenAway, ratio: denom? done/denom : 0 };
}
```

- [ ] **Step 2: `personelTaskPunctual`'i fiscalYear-bazlı yap**

Mevcut `personelTaskPunctual` fonksiyonunu tümüyle değiştir:

```javascript
function personelTaskPunctual(name, period, ytd){
  const win = ytd ? _pYtdInPeriod : _pInPeriod;
  const fy = _periodYear(period);
  const ts = (state.tasks||[]).map(normTask)
    .filter(t=>recFY(t)===fy && t.assignedTo===name && (win(t.dueDate,period)||win(t.completedAt,period)));
  if(!ts.length) return null;
  const onTime = ts.filter(t=>{
    if(!taskIsClosed(t)) return false;
    if(!t.dueDate) return true;
    const doneD = String(t.completedAt||today()).slice(0,10);
    const dueD = String(t.dueDate).slice(0,10);
    if(doneD!==dueD) return doneD < dueD ? true : doneD===dueD;   // gün bazlı
    // aynı gün → saat varsa saate bak
    if(t.dueTime && t.completedAt && String(t.completedAt).length>10){
      return String(t.completedAt).slice(11,16) <= t.dueTime;
    }
    return true;
  }).length;
  return onTime/ts.length;
}
```

- [ ] **Step 3: Doğruluk metriğini ekle**

`personelTaskPunctual`'in hemen ardına ekle:

```javascript
// Doğruluk = ilk seferde onaylanan / (onaylanan + revizyona düşen), yalnız onay gerektiren görevler.
// Performans sebebiyle elinden alınanlar da payda tarafına eklenir (kalite düşürücü).
function personelTaskDogruluk(name, period){
  const fy = _periodYear(period);
  const ts = (state.tasks||[]).map(normTask).filter(t=>recFY(t)===fy && t.assignedTo===name && t.needsApproval);
  const approvedClean = ts.filter(t=>t.status==='onaylandi' && (t.revisionCount||0)===0).length;
  const reviseCount = ts.reduce((a,t)=>a+(t.revisionCount||0),0);
  const takenAway = (state.tasks||[]).map(normTask).filter(t=>recFY(t)===fy &&
    (t.assignmentHistory||[]).some(h=>h.from===name && h.reason==='performans')).length;
  const denom = approvedClean + reviseCount + takenAway;
  if(denom===0) return null;   // veri yok → ağırlık dağılır
  return approvedClean/denom;
}
```

- [ ] **Step 4: `personelAutoMetric`'e `gorev_dogruluk` case'i ekle**

`personelAutoMetric` içinde `case 'gorev':` bloğunu bul (`grep -n "case 'gorev':"`, ~5676). Onun **hemen üstüne** ekle:

```javascript
    case 'gorev_dogruluk':
      return personelTaskDogruluk(name, period);
```

- [ ] **Step 5: `DEFAULT_EVAL_CONFIG`'e doğruluk kriterini ekle (ağırlık toplamı korunur)**

Her departmanda `{kod:'gorev', … weight:W}` kriterinin ağırlığını ikiye böl: `gorev` yeni ağırlık + yeni `gorev_dogruluk`. Aşağıdaki tam değişiklikleri uygula:

`satis.criteria`: `{kod:'gorev', … weight:0.05}` → `weight:0.03`; hemen sonrasına ekle:
```javascript
      {kod:'gorev_dogruluk', label:'Görev doğruluğu (onay/revizyon)', auto:true, weight:0.02},
```
`teknik.criteria`: `{kod:'gorev', … weight:0.05}` → `weight:0.03`; sonrasına:
```javascript
      {kod:'gorev_dogruluk', label:'Görev doğruluğu (onay/revizyon)', auto:true, weight:0.02},
```
`proje.criteria`: `{kod:'gorev', … weight:0.10}` → `weight:0.06`; sonrasına:
```javascript
      {kod:'gorev_dogruluk', label:'Görev doğruluğu (onay/revizyon)', auto:true, weight:0.04},
```
`muhasebe.criteria`: `{kod:'gorev', … weight:0.10}` → `weight:0.06`; sonrasına:
```javascript
      {kod:'gorev_dogruluk', label:'Görev doğruluğu (onay/revizyon)', auto:true, weight:0.04},
```
`saha.criteria`: `{kod:'is_emri', … weight:0.05}` → `weight:0.03`; sonrasına:
```javascript
      {kod:'gorev_dogruluk', label:'Görev doğruluğu (onay/revizyon)', auto:true, weight:0.02},
```

(Toplam departman ağırlıkları değişmez; yalnız görev bileşeni zamanlama/doğruluk olarak ikiye ayrılır.)

- [ ] **Step 6: Syntax testi** — Ön Bilgi komutu. Expected: `✅ SYNTAX OK`

- [ ] **Step 7: Tarayıcı doğrulaması**

Personel → Performans (yönetici). Bir kişiye onay-gerektiren görev ata, tamamlat, onayla → o kişinin skor kırılımında "Görev doğruluğu" satırı dolar. Aynı görevi revizyona gönderip tekrar onaylat → doğruluk düşer. `▼ Kriter detayı`nda `gorev` (zamanlama/tamamlama) ve `gorev_dogruluk` ayrı satırlar olarak görünür.
Ayrıca: 2026 damgalı bir görev 2027 aktif yılda prim skorunu **etkilemez** (fiscalYear filtresi).

- [ ] **Step 8: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(gorev): fiscalYear-bazlı prim + görev doğruluk skoru + performans devir cezası"
```

---

## Task 6: Şablon-Tetiklemeli Üretim + Cascade Temizlik

**Files:**
- Modify: `APRO_CRM_Firebase.html` — `personelAutoGenerateTasks` (`~6188-6220`) + tetik (`~1150`); silme handler'ları (fırsat `~4851`, serviceOpps `~5047`/`~5076`, teklif `~1395`, bakım)

- [ ] **Step 1: Kör otomatik üretimi devre dışı bırak**

Tetik satırını bul (`grep -n "personelAutoGenerateTasks(); // fire-and-forget"`, ~1150) ve **sil** (ya da yorum satırı yap):

```javascript
    // personelAutoGenerateTasks(); // KALDIRILDI — şablon-tetiklemeli modele geçildi (spec §8)
```

- [ ] **Step 2: Görev şablonlarını + "Görev öner" fonksiyonunu ekle**

`personelAutoGenerateTasks` fonksiyonunu bul; gövdesini bozmadan **üstüne** şablon sabitini ve öneri fonksiyonunu ekle:

```javascript
// Bağlam+aşama → standart görev şablonları. dept: doğru departman; dueOffset: bugünden gün.
const TASK_TEMPLATES = {
  proje: [
    { title:'Proje çizimi & malzeme listesi', dept:'proje',    dueOffset:7,  priority:'yuksek' },
    { title:'Hidrolik hesap',                 dept:'proje',    dueOffset:7,  priority:'yuksek' },
    { title:'Tedarikçi siparişleri',          dept:'muhasebe', dueOffset:14, priority:'orta'  },
    { title:'Saha mobilizasyon & İSG',        dept:'saha',     dueOffset:21, priority:'yuksek' },
    { title:'İş programı hazırlığı',          dept:'saha',     dueOffset:21, priority:'orta'  },
  ],
  servis: [
    { title:'Randevu & teknisyen planlama',   dept:'teknik',   dueOffset:2,  priority:'orta'  },
    { title:'Yedek parça / malzeme temini',   dept:'muhasebe', dueOffset:3,  priority:'orta'  },
    { title:'Saha müdahale',                  dept:'teknik',   dueOffset:5,  priority:'yuksek' },
    { title:'Test & devreye alma',            dept:'teknik',   dueOffset:6,  priority:'orta'  },
    { title:'Servis raporu & teslim',         dept:'teknik',   dueOffset:7,  priority:'orta'  },
  ],
};
function _offsetDay(n){ const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
// Bir kayıt için şablon görevlerini öner (kullanıcı onayıyla oluşturur). ctx: 'proje'|'servis'.
async function suggestTasksFor(ctx, linkType, linkId, linkLabel){
  const tpl = TASK_TEMPLATES[ctx]; if(!tpl) return;
  const people = personelPeople();
  const firstInDept = dept => { const u=people.find(x=>x.department===dept); return u?u.displayName:''; };
  const existing = new Set((state.tasks||[]).map(normTask).filter(t=>t.linkType===linkType&&t.linkId===linkId).map(t=>t.title));
  const toAdd = tpl.filter(x=>!existing.has(x.title)).map(x=>normTask({
    id: genId(), title:x.title, desc:'', assignedTo:firstInDept(x.dept), department:x.dept,
    assignedBy:(state.currentUser&&state.currentUser.displayName)||'', context:ctx,
    linkType, linkId, linkLabel:linkLabel||'', dueDate:_offsetDay(x.dueOffset), dueTime:'', startDate:'',
    status:'yapilacak', completedAt:null, priority:x.priority,
    needsApproval:defaultNeedsApproval(ctx,x.priority), revisionCount:0, assignmentHistory:[], comments:[],
    autoGenerated:true, createdBy:'şablon', createdAt:today(), fiscalYear:activeFiscalYear()
  }));
  if(!toAdd.length){ showToast('Bu kayıt için şablon görevleri zaten mevcut.'); return; }
  if(!confirm(toAdd.length+' adet '+(TASK_CONTEXT_META[ctx].l)+' görevi oluşturulsun mu?\n\n- '+toAdd.map(t=>t.title).join('\n- '))) return;
  for(const t of toAdd){ await personelSaveDoc('tasks', t); }
  showToast('✅ '+toAdd.length+' görev oluşturuldu.');
}
```

- [ ] **Step 3: Fırsat kartına "Görev öner" düğmesi ekle (kazanılan fırsatlar)**

Fırsat silme butonunu bul (`grep -n "Bu fırsatı silmek"`, ~4851). O `btn('🗑️', …)`'nin **hemen öncesine**, aynı buton satırına ekle:

```javascript
            o.stage==='KAZANILDI'?btn('📋 Görev öner',()=>suggestTasksFor('proje','opportunity',o.id,o.title||'Fırsat'),'#eef2ff','#4338ca','7px 12px',{fontSize:'12px',border:'1px solid #c7d2fe',borderRadius:'7px'}):h('span'),
```

- [ ] **Step 4: Servis (serviceOpp) kartına "Görev öner" düğmesi ekle**

serviceOpps silme butonlarını bul (`grep -n "deleteDoc('serviceOpps'"`, ~5047 ve ~5076). ~5076'daki (`if(confirm('Silinsin mi?')` olan) buton satırının **öncesine** ekle:

```javascript
            btn('🔧 Görev öner',()=>suggestTasksFor('servis','serviceOpp',o.id,(o.title||o.customer||'Servis')),'#ecfeff','#0e7490','8px 12px',{fontSize:'13px',border:'1px solid #a5f3fc',borderRadius:'7px'}),
```

- [ ] **Step 5: Cascade temizliği silme handler'larına bağla**

Aşağıdaki her silme çağrısında, `deleteDoc(...)` **öncesinde** `cascadeDeleteTasksFor` çağır ve manuel görev varsa sor. Her handler için değişiklik:

**Fırsat** (`grep -n "Bu fırsatı silmek"`): mevcut
```javascript
btn('🗑️',()=>{if(confirm('Bu fırsatı silmek istediğinizden emin misiniz?')){deleteDoc('opportunities',o.id).then(()=>setState({opportunities:state.opportunities.filter(x=>x.id!==o.id)}));}}, …)
```
→ onClick gövdesini şununla değiştir:
```javascript
async()=>{ if(!confirm('Bu fırsatı silmek istediğinizden emin misiniz?')) return;
  const r=await cascadeDeleteTasksFor('opportunity',o.id);
  if(r.manuals.length && !confirm(r.manuals.length+' bağlı manuel görev var. Fırsatla birlikte silinsin mi? (İptal: görevler kalır)')){ /* manuelleri bırak */ }
  else { for(const m of r.manuals){ await deleteDoc('tasks',m.id); } setState({tasks:(state.tasks||[]).filter(x=>!r.manuals.some(mm=>mm.id===x.id))}); }
  await deleteDoc('opportunities',o.id); setState({opportunities:state.opportunities.filter(x=>x.id!==o.id)});
  showToast('✅ Fırsat silindi'+(r.deletedAuto?(' · '+r.deletedAuto+' otomatik görev temizlendi'):'')); }
```

**serviceOpp** (`grep -n "deleteDoc('serviceOpps'"`, iki yer): her `deleteDoc('serviceOpps',o.id).then(...)` onClick'ini şu async gövdeyle değiştir:
```javascript
async()=>{ if(!confirm('Silinsin mi?')) return;
  const r=await cascadeDeleteTasksFor('serviceOpp',o.id);
  for(const m of r.manuals){ await deleteDoc('tasks',m.id); }
  if(r.manuals.length) setState({tasks:(state.tasks||[]).filter(x=>!r.manuals.some(mm=>mm.id===x.id))});
  await deleteDoc('serviceOpps',o.id); setState({serviceOpps:state.serviceOpps.filter(x=>x.id!==o.id)});
  showToast('✅ Silindi'+(r.deletedAuto?(' · '+r.deletedAuto+' otomatik görev'):'')); }
```
(İlk yerdeki — confirm'siz olan `btn('Sil', …)` — için `if(!confirm(...))` satırını dahil et; kullanıcı deneyimi için onay eklenmiş olur.)

**Bakım (maintenances)** ve **teklif (proposals)** silmede autoGenerated görev üretimi kalktığı için öksüz auto risk düşük; yine de tutarlılık için bakım silme handler'ında (`grep -n "deleteDoc('maintenances'"` varsa) aynı kalıpla `cascadeDeleteTasksFor('maintenance', m.id)` çağrısı ekle. Yoksa bu adımı atla (not düş).

- [ ] **Step 6: Syntax testi** — Ön Bilgi komutu. Expected: `✅ SYNTAX OK`

- [ ] **Step 7: Tarayıcı doğrulaması**

1. Kazanılan bir fırsatta "📋 Görev öner" → onay diyaloğu → 5 proje görevi doğru departmanlara, vadelerle oluşur; Görevler ekranında Proje bağlamında görünür.
2. Aynı fırsatta tekrar "Görev öner" → "zaten mevcut" uyarısı (çift oluşmaz).
3. O fırsatı sil → onay sonrası bağlı **otomatik görevler kaybolur** (toast'ta sayı görünür); Personel → Performans'ta o görevler artık prim skorunu etkilemez.
4. Manuel bir görevi bir fırsata bağlı bırakıp fırsatı silmeyi dene → manuel görev için ayrı onay sorulur.

- [ ] **Step 8: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(gorev): şablon-tetiklemeli görev üretimi + cascade temizlik; kör auto-gen kaldırıldı"
```

---

## Task 7: Onay Bekleyenler + Bugün/Bu Hafta Bölmeleri

**Files:**
- Modify: `APRO_CRM_Firebase.html` — `renderPersonelGorevler` üstüne özet bölmeleri

- [ ] **Step 1: Özet bölmelerini render eden fonksiyonu ekle**

`taskCard` fonksiyonunun ardına ekle:

```javascript
function renderTaskDigest(isAdmin, myName){
  const all = filterFY(state.tasks, activeFiscalYear()).map(normTask);
  const mine = all.filter(t=>t.assignedTo===myName && !taskIsClosed(t) && t.dueDate);
  const wkEnd = _offsetDay(7);
  const today0 = today();
  const bugun = mine.filter(t=>String(t.dueDate)<=today0);
  const buHafta = mine.filter(t=>String(t.dueDate)>today0 && String(t.dueDate)<=wkEnd);
  const onayBekleyen = isAdmin
    ? all.filter(t=>t.status==='tamamlandi' && t.needsApproval)
    : all.filter(t=>t.status==='tamamlandi' && t.needsApproval && t.assignedBy===myName);
  const chip=(lbl,n,color,onClick)=> n?h('div',{style:{background:color+'14',border:'1px solid '+color+'55',borderRadius:'10px',padding:'8px 12px',cursor:'pointer',fontSize:'12px',fontWeight:'700',color},onclick:onClick},lbl+': '+n):null;
  const items=[
    chip('⏰ Bugün/Geciken', bugun.length, '#dc2626', ()=>{PMOD.taskFilter='geciken';render();}),
    chip('📅 Bu hafta', buHafta.length, '#b45309', ()=>{PMOD.taskFilter='acik';render();}),
    chip('✅ Onay bekleyen', onayBekleyen.length, '#16a34a', ()=>{PMOD.taskFilter='onay';render();}),
  ].filter(Boolean);
  if(!items.length) return h('span');
  return h('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',marginBottom:'12px'}}, ...items);
}
```

Not: `h()` `onclick` özniteliğini destekliyorsa yukarıdaki çalışır; desteklemiyorsa `chip`'i `btn(...)` ile kur. Doğrula: `grep -n "onclick" APRO_CRM_Firebase.html | head`. Destek yoksa `chip`'i şu imzayla değiştir: `const chip=(lbl,n,color,onClick)=> n?btn(lbl+': '+n,onClick,color+'14',color,'8px 12px',{fontSize:'12px',fontWeight:'700',border:'1px solid '+color+'55',borderRadius:'10px'}):null;`

- [ ] **Step 2: Bölmeyi görevler ekranının başına yerleştir**

`renderPersonelGorevler`'in `return h('div',{}, fyEmptyBanner('tasks','görev'), addBtn, …)` satırını bul ve `fyEmptyBanner(...)`'dan hemen sonra `renderTaskDigest(isAdmin, myName)` ekle:

```javascript
  return h('div',{}, fyEmptyBanner('tasks','görev'), renderTaskDigest(isAdmin, myName), addBtn, addPanel, ctxBar, mgrBar, filterBar, viewBar, body);
```

- [ ] **Step 3: Syntax testi** — Ön Bilgi komutu. Expected: `✅ SYNTAX OK`

- [ ] **Step 4: Tarayıcı doğrulaması**

Görevler ekranı üstünde özet çipleri görünür: "⏰ Bugün/Geciken", "📅 Bu hafta", "✅ Onay bekleyen" (sayı > 0 olanlar). Çipe tıklayınca ilgili filtre uygulanır. Yönetici tüm onay bekleyenleri, personel yalnız kendi verdiği onay bekleyenleri görür.

- [ ] **Step 5: Commit**

```bash
git add APRO_CRM_Firebase.html
git commit -m "feat(gorev): onay bekleyen + bugün/bu hafta özet çipleri"
```

---

## Self-Review Notları (kapsam eşlemesi)

- Spec §2 Veri Modeli → Task 1 (normTask + alanlar).
- Spec §3 Durum/Onay/Devir → Task 2.
- Spec §4 Görünüm/Panolar → Task 3 (+ Task 7 özet).
- Spec §5 Bildirimler → Task 2/3 (olay), Task 4 (zaman-bazlı).
- Spec §6 Prim → Task 5.
- Spec §7 Mali Yıl (yıllar arası) → Task 5 (fiscalYear-bazlı filtre + `recFY`), devirde vade güncelleme Task 2 (`taskReassign` newDue).
- Spec §8 Şablon üretim → Task 6.
- Spec §9 Cascade → Task 1 (`cascadeDeleteTasksFor`) + Task 6 (bağlama).
- Spec §10 Geriye uyumluluk → Task 1 (normTask, load normalize).
- Spec §11 YAGNI → plana dahil edilmedi (Gantt, kapasite, tekrarlayan, 1-5 puan, per-owner süre, Faz 2/3 icra kayıtları).
- Spec §12 Uygulama sırası → Task 1-7 aynı sırayı izler.

Tip tutarlılığı: `normTask` alan adları (`assignedBy`, `linkType/linkId/linkLabel`, `needsApproval`, `revisionCount`, `assignmentHistory`, `comments`, `dueTime`, `startDate`) tüm task'larda aynı kullanılır. Durum kodları `TASK_STATUS_META` anahtarlarıyla (`yapilacak/devam/beklemede/tamamlandi/onaylandi/revizyon`) tutarlı. `taskIsClosed`/`defaultNeedsApproval`/`recFY` her yerde aynı imzayla çağrılır.
