# Faz 3a — Arıza Servis İcra (Tasarım / Spec)

**Tarih:** 2026-07-30
**Kapsam:** `services` (Teknik Servis) koleksiyonu üzerine arıza müdahale icra takibi.
**Dışında:** `maintenances` (Periyodik Bakım → Faz 3b), `serviceOpps` (Servis satış pipeline — dokunulmaz), yapısal parça/stok/maliyet modülü.

---

## 1. Amaç ve Bağlam

A-Pro yangın koruma mühendisliğinde arızalar reaktif ve tek seferliktir: müşteri talep açar, sahaya gidilir, müdahale edilir, kapanır. Amaç **iş atlanmaması + müşteri memnuniyeti + ekip takibi**. Bu, Faz 2'deki proje icra deseninin (aşama motoru) servis eksenine taşınmasıdır.

Faz 3 iki seri işe ayrılmıştır (danışman kararı): **Faz 3a = Arıza (services)** doğrusal aşama motoru; **Faz 3b = Periyodik bakım (maintenances)** tekrar/vade takibi. Bu doküman yalnız **Faz 3a**'yı kapsar.

## 2. Servis Koleksiyonlarının Ayrımı (R5 kararı)

- **`serviceOpps` (Servis İş Takip)** = servis SATIŞ pipeline'ı (opportunity aynası, fırsat→KAZANILDI). **Dokunulmaz.** Faz1 "🔧 Görev öner" butonu (satış görevleri, `linkType:'serviceOpp'`) korunur.
- **`services` (Teknik Servis)** = servis teklifi + **arıza icrası** (bu faz). İcra görevleri `linkType:'service'`.
- Otomatik `serviceOpp → service` dönüşümü **kurulmayacak** (YAGNI). İcra manuel başlatılır.
- Karışmayı önlemek için UI'da tek cümlelik ayrım etiketi konur.

## 3. Veri Modeli

`services` kaydına, **okuma anında default'lanan** (erişildiğinde eklenen, mevcut kayıtları bozmayan) alanlar:

| Alan | Tip | Default | Açıklama |
|---|---|---|---|
| `execActive` | bool | `false` | Arıza icrası aktif mi |
| `execStage` | string | `'talep'` | İcra aşaması (SERVICE_STAGES üyesi) |
| `execStartedAt` | string(ISO) | `''` | İcraya alınma tarihi |
| `execClosedAt` | string(ISO) | `''` | Kapanış tarihi |
| `execStageHistory` | array | `[]` | `{stage, at, by}` geçiş kayıtları |
| `execUrgency` | string | `'normal'` | Aciliyet: `dusuk`/`normal`/`acil` (R6) |
| `execTargetDate` | string(ISO) | `''` | Opsiyonel hedef müdahale tarihi (R6) |
| `execCloseNote` | string | `''` | Kapanışta yapılan işlem + değişen parça serbest metni (R7) |

**Mevcut `status`** (Gönderildi/Revize/Onaylandı/Randevu = satış/teklif ekseni) **dokunulmaz**; icra ayrı eksendir.

Normalizasyon: Faz 2'deki `normTask` / erişim-anı default deseni izlenir. `services` okunurken bu alanlar yoksa yukarıdaki default'larla tamamlanır (kalıcı yazma zorunlu değil; `projStage` gibi salt-okuma güvenli erişim fonksiyonları kullanılır).

## 4. Aşamalar (R1 — yeniden adlandırıldı)

`status`'taki "Randevu" ile çakışmayı önlemek için icra aşaması "randevu" yerine "planlama" adlandırıldı.

```
SERVICE_STAGES = ['talep','planlama','mudahale','kapanis']
```

| Kod | Etiket | İkon | Renk (öneri) |
|---|---|---|---|
| `talep` | Talep | 📩 | #6366f1 |
| `planlama` | Planlama | 📅 | #0891b2 |
| `mudahale` | Müdahale | 🔧 | #d97706 |
| `kapanis` | Kapanış | ✅ | #16a34a |

`SERVICE_STAGE_META = { kod: {l, icon, color} }`.

## 5. Aşama Görev Şablonları (onay bazlı)

Faz 2 deseni: aşamaya girişte öneri, onay ile eklenir, atlanabilir. `SERVICE_STAGE_TEMPLATES`:

| Aşama | Görev | dept (öneri) |
|---|---|---|
| `talep` | Arıza detayı + müşteri bilgisi teyidi | Teknik |
| `planlama` | Müşteriyle gün/saat teyidi | Teknik |
| `mudahale` | Arıza tespiti + parça/malzeme kontrolü | Teknik |
| `kapanis` | Servis formu imzalat + memnuniyet teyidi | Teknik |

Görevler: `linkType:'service'`, `linkId:service.id`, `linkLabel:jobName`, `context:'servis'`, ilgili `execStage`. Faz1 `TASK_TEMPLATES.servis` genel mantığı korunur (mükerrerlik `linkType` + başlık dedup ile önlenir).

## 6. Tetikleyici ve "İcra Bekleyen" Tanımı (R3)

- **Tetikleyici:** Manuel — Teknik Servis kartında **"İcraya al"** butonu (`servStart`).
- **İcra bekleyen** listesi = `execActive!==true && status ∈ {'Onaylandı','Randevu'}` (iş kesinleşmiş ama icraya alınmamış). Böylece liste tüm tekliflerle dolmaz.
- **Aktif** = `execActive===true && !execClosedAt`.
- **Kapanan** = `execActive===true && execClosedAt`.

## 7. Aciliyet / SLA (R6)

- `execUrgency`: `dusuk` / `normal` / `acil`. İcraya alırken ve modalda seçilebilir.
- `execTargetDate`: opsiyonel hedef müdahale tarihi.
- **İcra bekleyen + Aktif** listelerinde `acil` olan veya `execTargetDate` geçmiş kayıtlar **kırmızı** vurgulanır (yangın güvenliğinde geciken arıza = can + hukuki risk).

## 8. Aşama Fonksiyonları (Faz 2 aynası)

- `servExecStage(s)` — güvenli aşama okuma (SERVICE_STAGES üyeliğini doğrular, değilse `'talep'`).
- `servIsActive(s)` / `servIsAwaiting(s)` / `servIsClosed(s)` — durum yardımcıları (§6 tanımları).
- `servStageTasks(s, stage)` / `servOpenCount(s)` — aşama görevleri / açık görev sayısı.
- `suggestServStageTasks(s, stage)` — onay bazlı şablon görev önerisi.
- `servStart(s)` — icraya al (execActive=true, execStage='talep', execStartedAt, history).
- `servAdvance(s)` — sonraki aşama (açık görev varsa uyar; history ekle; yeni aşama şablonu öner).
- `servClose(s)` — kapat (execCloseNote iste/kaydet, execClosedAt).
- `servRollback(s)` — bir önceki aşamaya al (**admin**).
- `servReopen(s)` — kapananı yeniden aç (**admin**).

## 9. UI (R5 etiketli)

Teknik Servis ekranına (`renderServices`) görünüm sekmeleri:

- **Tümü** (mevcut satış listesi — bozulmaz)
- **İcra bekleyen** (§6 filtresi)
- **Aktif** — liste + **Kanban** (4 aşama kolonu, `renderArizaKanban`)
- **Kapanan**

`buildArizaModal(serviceId)`: aşama şeridi, aksiyon butonları (İcraya al / Sonraki aşama / Kapat / Geri al + Yeniden aç [admin] / +görev öner), aciliyet + hedef tarih, aşama-gruplu görevler (`taskCard`). Kapanışta `execCloseNote` alanı.

Ekran başında tek cümlelik ayrım notu: "Servis İş Takip = servis satış/fırsat; Teknik Servis icra = gelen arıza müdahale takibi."

## 10. Yetkiler

- İcraya al + aşama ilerlet + kapat → **herkes**
- Geri al + kapananı yeniden aç → **sadece admin**

## 11. Cascade Delete (R4)

`services` silme yolu (`delItem('services',id)` / ilgili silme akışı) **`cascadeDeleteTasksFor('service',id)`** çağırmalı — aksi halde `linkType:'service'` görevler öksüz kalır. Faz 2'deki `opportunity` deseni birebir.

## 12. Doğrulama

- JS syntax: `node vm.Script` → `✅ SYNTAX OK` (CLAUDE.md komutu).
- Manuel tarayıcı: İcraya al → aşama ilerlet → kapat → geri al/yeniden aç (admin) → sil (görevler temizlenir) → aciliyet kırmızı vurgu → "İcra bekleyen" filtresi doğru.

## 13. Kapsam Dışı (net sınır)

- Periyodik bakım (Faz 3b).
- `serviceOpps` değişiklikleri; otomatik dönüşüm.
- Yapısal parça/stok/maliyet/fatura modülü.
