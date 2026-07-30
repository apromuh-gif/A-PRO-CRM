# A-PRO CRM — Faz 2: Proje İcra Kaydı Tasarım Dokümanı

**Tarih:** 2026-07-30
**Dosya:** `APRO_CRM_Firebase.html`
**Kapsam:** Kazanılan fırsatları, aşamalı bir icra (uygulama) sürecinde takip etmek. Görev motoru (Faz 1) üzerine kurulur; onu değiştirmeden genişletir. Faz 3 (Servis icra) ayrı spec'te ele alınır ve bu deseni tekrarlar.

---

## 1. Amaç ve Bağlam

Faz 1 birleşik görev motorunu kurdu (bağlam: şirket/proje/servis, durum akışı, onay/revizyon, devir, prim entegrasyonu). Ancak "proje" bağlamı bugün yalnızca fırsata bağlı düz görevlerdir; kazanılan bir işin **aşama aşama icrası** (teknik → satın alma → saha → montaj → hakediş) takip edilmiyor.

Faz 2 hedefi: kazanılan bir fırsatı, kontrollü ve sıralı bir aşama akışında yürütmek; her aşamaya geçince doğru departmana standart görevleri önermek; tüm aktif projeleri tek panoda görmek.

Şirket bağlamı: A-Pro Mühendislik — yangın algılama/söndürme sistemleri; teklif → montaj → hakediş akışı olan saha ağırlıklı ekip.

### Temel Karar (onaylı)

**Kazanılan fırsatın kendisi projeye dönüşür — yeni koleksiyon yok.** `opportunities` kaydına icra alanları geriye uyumlu eklenir; `stage==='KAZANILDI'` ve `execActive===true` olan fırsat "aktif proje" sayılır. Görevler Faz 1'deki bağlanma zincirini (`linkType:'opportunity'`, `context:'proje'`) **aynen** korur; üstüne bir aşama boyutu (`execStage`) eklenir. Böylece Faz 1'in link / cascade / prim mantığı hiç kırılmaz.

---

## 2. Veri Modeli

### 2.1 `opportunities` — icra alanları (yeni, geriye uyumlu)

Migration yok. Ayrı bir `normOpp` katmanı yazılmaz; alanlara **erişim-anında `??`/`||` varsayılanı** verilir (ör. `o.execActive===true`, `o.execStage||'teknik'`). Fırsat kaydı Faz 1 görevlerine göre hafif olduğundan tam bir normalize fonksiyonu gereksizdir.

| Alan | Açıklama | Varsayılan |
|---|---|---|
| `execActive` | İcra başladı mı? | `false` |
| `execStage` | Aktif aşama: `teknik`/`satinalma`/`saha`/`montaj`/`hakedis` | `'teknik'` |
| `execStartedAt` | İcraya başlama damgası (ISO) | `null` |
| `execStageHistory[]` | `{stage, at, by}` — aşama geçiş izi (ileri + yönetici geri-adım) | `[]` |
| `execClosedAt` | Kapanış damgası (ISO) | `null` |

- `jobStatus` (müşteri tipi: SON KULLANICI/MÜTEAHHİT…) ile karışmaz — icra aşaması ayrı alandır.
- `execActive===false` iken bu alanların hiçbiri kullanılmaz; kayıt sıradan fırsattır.

### 2.2 `tasks` — aşama alanı (yeni, geriye uyumlu)

| Alan | Açıklama | Varsayılan |
|---|---|---|
| `execStage` | Görev hangi icra aşamasına ait (`teknik`…`hakedis`) | `''` (boş) |

- Faz 1'de üretilmiş / elle eklenmiş, `execStage` boş olan bağlı görevler **aktif aşamaya** sayılır (Bölüm 4.3 açık-görev kuralı). Ayrı "aşamasız" bölmesi yoktur.
- `normTask`'a `execStage: t.execStage || ''` satırı eklenir (idempotent, okuma-anında).

---

## 3. Aşama Modeli

Beş sabit aşama, sabit sıra:

```
teknik → satinalma → saha → montaj → hakedis
```

```js
const PROJECT_STAGES = ['teknik','satinalma','saha','montaj','hakedis'];
const PROJECT_STAGE_META = {
  teknik:    { label:'Teknik/Ofis',     icon:'📐', color:'#4338ca' },
  satinalma: { label:'Satın Alma',      icon:'🛒', color:'#b45309' },
  saha:      { label:'Saha Hazırlık',   icon:'🚧', color:'#0e7490' },
  montaj:    { label:'İmalat/Montaj',   icon:'🔧', color:'#047857' },
  hakedis:   { label:'Hakediş/Kapanış', icon:'📑', color:'#7c3aed' },
};
```

İleride ayarlardan düzenlenebilir yapılabilir (YAGNI — Faz 2'de sabit).

---

## 4. Aşama Akışı ve İlerleme

### 4.1 İcraya başlatma (manuel — onaylı)

- Bir fırsat `stage==='KAZANILDI'` ise, **Projeler menüsündeki "İcra bekleyen" bölümünde** görünür (kazanıldı ama `execActive===false`).
- Oradaki **"🏗 İcraya başlat"** düğmesi: `execActive=true`, `execStage='teknik'`, `execStartedAt=now`, `execStageHistory=[{stage:'teknik', at:now, by:me}]`.
- **Not:** Giriş noktası fırsat kartında değil, Projeler menüsündedir (Karar Q6=B ile tutarlı; fırsat kartı temiz kalır).
- Başlatınca "teknik" aşamasının şablon görevleri önerilir (Bölüm 5).

### 4.2 İleri ilerleme (sıralı + açık-görev uyarısı)

- Proje ekranında **"Sonraki aşama →"** düğmesi yalnızca bir sonraki aşamaya geçirir (atlama yok).
- Basınca aktif aşamada **açık görev** varsa uyarı: *"Bu aşamada N açık görev var. Yine de ilerlensin mi?"* → Onayla / Vazgeç.
- İlerleyince `execStage` güncellenir, `execStageHistory`'ye `{stage, at, by}` eklenir, yeni aşamanın şablonu önerilir.
- `hakedis` (son aşama) aktifken **"Sonraki aşama →" görünmez**; yalnız "Projeyi kapat" bulunur.

### 4.3 Açık-görev tanımı (tek kaynak)

Açık görev = Faz 1'in `taskIsClosed(t)===false` görevleri. Yeni tanım yazılmaz. Bir aşamanın açık görevleri:

```
bağlı görevler (linkType==='opportunity' && linkId===opp.id)
  ∩ !taskIsClosed(t)
  ∩ (t.execStage === opp.execStage || !t.execStage)   // boş execStage aktif aşamaya sayılır
```

### 4.4 Kapanış ve geri-alma

- `hakedis` aşamasında **"✓ Projeyi kapat"** → `execClosedAt=now`. Proje "Kapanan projeler" bölümüne düşer.
- **Yönetici geri-alma:** yalnız admin, projeyi bir önceki aşamaya çekebilir veya kapanmış projeyi yeniden açabilir (`execClosedAt=null`). Her geri-adım `execStageHistory`'ye kaydedilir. (Minimal; kilitlenmeyi önler.)

### 4.5 Tutarlılık koruması

- `execActive===true` iken kullanıcı fırsatın `stage`'ini KAZANILDI'dan çıkarmaya çalışırsa uyarı: *"Bu fırsatın aktif icrası var. Devam edilirse icra iptal edilir."* → onaylarsa `execActive=false` (icra durur, görevler kalır).

---

## 5. Aşama Görev Şablonları (onaylı)

Ayrı bir yapı; Faz 1'in `TASK_TEMPLATES` (servis/genel) yapısına dokunulmaz.

```js
const PROJECT_STAGE_TEMPLATES = {
  teknik: [
    { title:'Sözleşme / iş emri açılışı', dept:'proje',  dueOffset:2,  priority:'yuksek' },
    { title:'Hidrolik hesap / sistem tasarımı', dept:'teknik', dueOffset:5, priority:'yuksek' },
    { title:'Uygulama (shop drawing) çizimi', dept:'teknik', dueOffset:8, priority:'orta' },
    { title:'Malzeme listesi (BOQ) çıkarma', dept:'teknik', dueOffset:8, priority:'orta' },
  ],
  satinalma: [
    { title:'Tedarikçi teklif toplama', dept:'muhasebe', dueOffset:3, priority:'orta' },
    { title:'Malzeme siparişi', dept:'muhasebe', dueOffset:5, priority:'yuksek' },
    { title:'Sevkiyat / teslim takibi', dept:'muhasebe', dueOffset:10, priority:'orta' },
  ],
  saha: [
    { title:'Saha ölçü doğrulama', dept:'saha', dueOffset:2, priority:'orta' },
    { title:'İSG / izin dosyası', dept:'muhasebe', dueOffset:3, priority:'yuksek' },
    { title:'Ekip / ekipman mobilizasyon', dept:'muhasebe', dueOffset:4, priority:'orta' },
  ],
  montaj: [
    { title:'Boru / sprinkler montajı', dept:'saha', dueOffset:10, priority:'yuksek' },
    { title:'Pano / algılama montajı', dept:'saha', dueOffset:12, priority:'yuksek' },
    { title:'Test & devreye alma', dept:'teknik', dueOffset:14, priority:'yuksek' },
  ],
  hakedis: [
    { title:'Geçici kabul', dept:'saha', dueOffset:3, priority:'orta' },
    { title:'As-built (imalat sonu çizim)', dept:'saha', dueOffset:5, priority:'orta' },
    { title:'Kesin kabul', dept:'saha', dueOffset:7, priority:'orta' },
    { title:'Hakediş dosyası', dept:'proje', dueOffset:5, priority:'yuksek' },
  ],
};
```

- `dueOffset` = aşamaya geçiş gününden itibaren gün sayısı (`_offsetDay` ile Faz 1'deki gibi).
- `dept` Faz 1 departman kodlarıyla uyumlu: `satis/saha/teknik/proje/muhasebe`.

### 5.1 Öneri akışı (kör üretim yok)

- Aşamaya geçince o aşamanın şablonu bir **öneri panelinde** listelenir; kullanıcı "Hepsini ekle" veya tek tek seçer.
- Yeni fonksiyon `suggestStageTasks(opp, stage)`: seçilenleri `context:'proje'`, `linkType:'opportunity'`, `linkId:opp.id`, `linkLabel:opp.title`, `execStage:stage`, `assignedTo` (varsayılan: fırsat sahibi), `department:dept`, `dueDate:_offsetDay(dueOffset)`, `priority`, `autoGenerated:true`, `needsApproval:defaultNeedsApproval('proje',priority)` ile ekler.
- Faz 1'deki başlık-bazlı dedup (aynı `linkId` altında aynı `title` tekrar eklenmez) korunur.

### 5.2 Faz 1 geçiş düğmesinin kaldırılması

Fırsat kartındaki geçiş dönemi **"📋 Görev öner"** düğmesi (`suggestTasksFor('proje','opportunity',…)`) kaldırılır — yerini "İcraya başlat" + aşama-bazlı öneri alır. `TASK_TEMPLATES['proje']` (düz liste) artık kullanılmadığından silinebilir; `TASK_TEMPLATES['servis']` (Faz 3'e kadar) korunur. Servis kartındaki "🔧 Görev öner" düğmesine dokunulmaz.

---

## 6. Projeler Ekranı (yeni ana menü)

Yeni sekme: `{id:'projeler', l:'🏗 Projeler'}` — TABS dizisine, `personel`'den önce eklenir. `state.tab==='projeler'` → `renderProjeler()`.

### 6.1 Bölmeler

1. **İcra bekleyen** — `stage==='KAZANILDI' && !execActive`. Her kartta "🏗 İcraya başlat".
2. **Aktif projeler** — `execActive && !execClosedAt`. Ana içerik; Liste/Kanban toggle (Bölüm 6.2).
3. **Kapanan projeler** — `execClosedAt` dolu. Katlanır/az yer kaplar; yönetici "yeniden aç".

### 6.2 Görünüm: Liste + Kanban toggle (Karar Q6=B → C)

- Faz 1 görev ekranındaki `PMOD.taskView` desenini tekrarlayan bir görünüm state'i (`PMOD.projView='liste'|'kanban'`), varsayılan **Liste** (mobil-güvenli).
- **Liste:** proje satırı — başlık, müşteri, aktif aşama rozeti, açık görev sayısı, sonraki-aşama/detay düğmeleri.
- **Kanban:** 5 aşama sütunu (`PROJECT_STAGES`), aktif projeler `execStage`'ine göre sütunlarda kart. Masaüstünde portföy görünürlüğü. Mobilde (`innerWidth<=768`) otomatik Liste'ye düşülebilir.

### 6.3 Proje detay (kart → açılır)

Bir projeye tıklayınca: aşama şeridi (tamamlanan/aktif/bekleyen), "Sonraki aşama →" / "Projeyi kapat", ve o projenin görevleri (Faz 1 `taskCard` yeniden kullanılır, `execStage`'e göre gruplanır). Görev tıklaması Faz 1'in `openTaskModal`'ını açar.

---

## 7. Rol Görünürlüğü (Karar Q8=A — Faz 1 ile aynı)

- **Normal kullanıcı:** yalnız sahibi olduğu projeler (`opp.assignedTo === currentUser.displayName`).
- **Yönetici/admin:** tüm projeler + departman/kişi filtresi (Faz 1 görev ekranındaki `mgrBar` deseni).

---

## 8. Faz 1 ile Entegrasyon

- **Link zinciri:** görevler `linkType:'opportunity'`, `linkId:opp.id` ile bağlı kalır → mevcut `cascadeDeleteTasksFor('opportunity', id)` fırsat silinin­ce icra görevlerini de temizler (ek iş yok).
- **Prim/performans:** Aşamalar prim'e **doğrudan** etki etmez; prim yine görev doğruluk/dakiklik üzerinden (Faz 1) işler. Aşama görevleri normal görevlerdir, normal prim etkisi vardır.
- **Bildirim:** Görev vade hatırlatmaları Faz 1 `taskDueReminders()` ile zaten kapsanır; aşamaya özel yeni bildirim eklenmez (YAGNI).
- **`normTask`:** `execStage` varsayılanı eklenir; başka değişiklik yok.

---

## 9. Geriye Uyumluluk

- Tüm yeni alanlar opsiyonel, okuma-anında varsayılanlı; migration yok.
- `execActive` girmemiş eski fırsatlar sıradan fırsat gibi davranır; Projeler menüsünde "aktif" görünmez (yalnız KAZANILDI ise "İcra bekleyen"de listelenir).
- `execStage` boş eski görevler aktif aşamaya sayılır (Bölüm 4.3), kaybolmaz.

---

## 10. Kapsam Sınırı (YAGNI — Faz 2'de YOK)

- Hakediş finansal takibi (tutar/fatura/KDV) — Karar Q5=A ile dışarıda; gerekirse ayrı faz.
- Kullanıcı-tanımlı esnek aşamalar — sabit 5 aşama.
- Otomatik aşama geçişi — manuel + uyarılı.
- Gantt / zaman çizelgesi / kapasite planlama.
- Aşamaya özel yeni bildirim türleri.
- Faz 3 (Servis icra kaydı) — ayrı spec.

---

## 11. Uygulama Sırası (Faz 2)

Her adım sonrası `node vm.Script` syntax testi:

1. Veri modeli: `opportunities` icra alanları + `normTask` `execStage` (okuma-anında varsayılan).
2. Sabitler: `PROJECT_STAGES`, `PROJECT_STAGE_META`, `PROJECT_STAGE_TEMPLATES`; yardımcılar (aşama ilerlet/kapat/geri-al, açık-görev sayacı).
3. `suggestStageTasks(opp, stage)` + öneri paneli; Faz 1 "📋 Görev öner" (proje) düğmesinin kaldırılması.
4. Projeler menüsü + `renderProjeler()`: İcra bekleyen / Aktif (Liste+Kanban) / Kapanan bölmeleri, rol görünürlüğü.
5. Proje detay: aşama şeridi + görev listesi (Faz 1 `taskCard`/`openTaskModal` yeniden kullanımı).
6. Tutarlılık koruması: KAZANILDI'dan çıkışta icra-iptal uyarısı.
