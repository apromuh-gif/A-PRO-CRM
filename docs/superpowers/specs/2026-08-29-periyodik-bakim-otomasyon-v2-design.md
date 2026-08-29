# Periyodik Bakım Otomasyonu v2 — Tasarım / Spec

**Tarih:** 2026-08-29
**Kapsam:** `maintenances` (Periyodik Bakım, çok-sistemli `mtSystems` modeli) — otomatik takvim, geçmişe dönük giriş, görev senkronu, geciken mail.
**Önceki karar revizyonu:** `2026-07-30-faz3b-periyodik-bakim-design.md` §13 — "bakımda görev motoru yok" kararı bu dokümanla tersine çevrildi.

---

## 1. Amaç ve Bağlam

Bu oturumda iki gerçek hata bulundu ve düzeltildi:
1. Sunucu tarafı (nextaura-admin) 7-gün-önce bakım maili `m.appointmentDate` (var olmayan alan) okuduğu için hiç gitmiyordu → `m.mtNextDue`'ya bağlandı (commit `299f768`).
2. Çok-sistemli bakım takibinde sözleşme bitiş tarihi / kaç-kez / geçmişe dönük giriş yoktu → Bitiş Tarihi + otomatik program + "+ Geçmiş Kayıt Ekle" eklendi (commit `cd38839`).

Bu doküman, aynı modülün **ikinci katman** ihtiyaçlarını kapsar: kaçıncı-bakım bazlı geri dönük giriş, sabit takvimin korunması (müşteri kaynaklı kaymalara rağmen), admin/personel takibi için görev entegrasyonu, ve geciken bakım için tekrarlayan mail.

## 2. Veri Modeli Değişiklikleri

`mtSystems[i]` öğesine (mevcut `sysKey, freq, due, lastDone`) eklenir:

| Alan | Tip | Default | Açıklama |
|---|---|---|---|
| `doneCount` | number | `0` | Bu sistem için tamamlanmış sayılan ziyaret sayısı (sıradaki planlanan index'i belirler). |

`maintenances` kaydına (üst seviye, önceki oturumda eklendi, burada resmileştiriliyor):

| Alan | Tip | Default | Açıklama |
|---|---|---|---|
| `mtEndDate` | string(ISO) | `''` | Sözleşme bitiş tarihi (yoksa `appointmentEnd`, o da yoksa boş — açık uçlu sözleşme). |

**Geriye dönük uyumluluk:** `doneCount` eksik kayıtlarda `0` varsayılır. `mtEndDate` boşsa (mevcut canlı kayıtların çoğu) program (`schedule`) boş döner → aşağıdaki tüm yeni özellikler (numaralandırma, sapma rozeti, kaçıncı-bakım seçici) o sistem için **devre dışı** kalır, eski davranış (`due` serbest metin/elle giriş) aynen çalışmaya devam eder. Hiçbir mevcut kayıt bozulmaz.

## 3. Program (Schedule) — Tek Kaynak

`mtGenerateSchedule(base, end, freq)` (önceki oturumda eklendi) tek kaynaktır: `base+freq, base+2*freq, ... ≤ end`. Bu fonksiyon **saf** kalır (yan etkisiz), her render'da taze hesaplanır — ayrı bir yerde tekrar saklanmaz.

- **Planlanan (baseline) sıradaki tarih** = `schedule[doneCount]`.
- **Etkin vade** (`s.due`) = admin/müşteri ile netleşen fiili tarih; varsayılan olarak `schedule[doneCount]`'a eşittir, elle değiştirilebilir (mevcut davranış korunur).
- Bir ziyaret tamamlandığında (`mtAdvanceSystem`) **`due`'dan değil `schedule[doneCount]`'tan** ilerlenir: `doneCount += 1; due = schedule[doneCount] || ''`. Böylece bir ziyaretin fiili tarihinin (müşteri talebiyle) kayması, **sonraki ziyaretlerin planlı tarihini etkilemez** — sözleşme takvimi sabit kalır.

## 4. "Plandan Sapma" Rozeti

`schedule.length` varsa ve `s.due` ile `schedule[doneCount]` arasındaki fark **3 günden fazlaysa**, vade tarihi inputunun yanında bilgi rozeti gösterilir: `⚠️ Plandan N gün kaydı` (N = gün farkı, mutlak değer). Engelleyici değildir, yalnız görünür kılar. Müşteri talebiyle esneme meşru; iç disiplin için iz bırakılır.

## 5. Numaralandırılmış Planlanan Liste (UI)

Mevcut düz "Planlanan (4 kez): tarih, tarih, ..." satırı şu şekle döner:

```
2. Bakım: 28.02.2027   3. Bakım: 28.05.2027   4. Bakım: 28.08.2027
```

Sıra numarası **schedule içindeki mutlak index+1**'dir (tamamlanan varsa listede görünmez ama numaralar kaymaz — 1. tamamlandıysa liste 2'den başlar). `schedule.length>0 && doneCount>=schedule.length` durumunda: "✅ Sözleşme kapsamındaki tüm bakımlar tamamlandı" notu.

## 6. Kaçıncı-Bakım Bazlı Geri Dönük Giriş

Önceki oturumda eklenen "+ Geçmiş Kayıt Ekle" (düz tarih+not `prompt()`) şu akışla **değiştirilir**:

1. Sistem seç (birden fazla sistem varsa; tek sistemde otomatik seçili).
2. Seçilen sistemin `schedule`'ı varsa (yani `mtEndDate` girilmişse): "Kaçıncı bakım tamamlandı?" — `doneCount+1`'den `schedule.length`'e kadar bir sayı seçtirilir (dropdown/prompt).
3. Fiili tarih iste (varsayılan: seçilen occurrence'ın planlı tarihi `schedule[N-1]`, elle değiştirilebilir — geçmişe dönük gerçek tarih girilebilsin diye).
4. Not iste (opsiyonel, mevcut davranış).
5. Uygula: seçilen sistemin `doneCount = N`, `due = schedule[N] || ''`; `mtHistory`'e `{at: fiiliTarih, by, note, systems, occurrence:N}` eklenir.
6. `schedule` yoksa (mtEndDate girilmemiş): mevcut düz tarih+not davranışı aynen kalır (geri uyumluluk).

Bu, orijinal talebi tam karşılar: "2. bakım manuel girildi" dendiğinde 3. ve 4. tarihler **yeniden hesaplanmadan**, zaten var olan sabit programdan otomatik ortaya çıkar.

## 7. Görev (Task) Entegrasyonu — Kararın Revizyonu

**Model: tek, kayan (rolling) görev per maintenance kaydı.** Sözleşmedeki N ziyaret için N görev açılmaz — yalnız "sıradaki" iş.

Yeni fonksiyon `maintSyncTask(m)`, her bakım kaydı `persistMaint()` çağrısından sonra (bkz. §9) tetiklenir:

- Deterministik id: `'auto_maint_' + m.id` (idempotent upsert, `tasks` koleksiyonu).
- `m.mtNextDue` boşsa (program bitti / sistem tanımsız): açık görev varsa **kapatılır** (`status:'tamamlandi'`) — yeni iş yok.
- `m.mtNextDue` doluysa: görev upsert edilir —
  `title: '🔁 Periyodik Bakım: ' + (customerName) + ' — ' + (jobName)`,
  `assignedTo: m.serviceContact`, `department: (serviceContact'ın departmanı)`,
  `dueDate: m.mtNextDue`, `context:'bakim'`, `linkType:'maintenance'`, `linkId: m.id`,
  `priority:'orta'`, `autoGenerated:true`, `createdBy:'sistem'`.
  **`status` kuralı:** görev `dueDate`'i yeni `mtNextDue` ile aynıysa mevcut `status`'a dokunulmaz (personel zaten üzerinde çalışıyor olabilir). `dueDate` değiştiyse (yeni döngü başladı) `status:'yapilacak'` olarak sıfırlanır — kapalı/tamamlanmış görev, yeni vadeyle birlikte otomatik yeniden açılır. Bu "kayan" modelin doğal parçasıdır: her zaman tam olarak bir açık iş kalemi vardır.
- **Reassignment (personel değişikliği):** görev zaten varsa ve `task.assignedTo !== m.serviceContact`: `assignedTo` güncellenir, `assignmentHistory`'e `{from, to, at:today(), by:'sistem', reason:'sistem', note:'İlgili kişi bakım kaydında değiştirildi.'}` eklenir, yeni atanan kişiye `showNotification('task_reassign_'+task.id, ...)` ile bildirim gider (mevcut manuel devir akışıyla aynı bildirim deseni).
- **Silme:** `delItem('maintenances', id)` içine `if(col==='maintenances'){ await cascadeDeleteTasksFor('maintenance', id); }` eklenir (mevcut generic fonksiyon, `services` için zaten aynı desende kullanılıyor).

## 8. Geciken Bakım Maili — 2 Günde Bir

`nextaura-admin/src/lib/crm-reminders.ts` — mevcut 7-gün-önce bloğunun yanına yeni blok:

- Koşul: `m.mtNextDue` dolu, vade **geçmiş** (`diff = diffDaysFromToday(...) <= 0`), ve `Math.abs(diff) % 2 === 0` (vade günü dahil, sonra 2 günde bir: 0, -2, -4, ...).
- Dedup key **güne özel** olmalı (mevcut 7-gün-önce key'i tek seferlik tasarlanmış, tekrar göndermeye izin vermiyor): `'mail_maint_overdue_' + m.id + '_' + todayISO`.
- Alıcı: aynı `serviceContact || preparedBy` deseni (§1'de zaten düzeltildi).
- Konu/gövde: "🔴 Bakım Gecikti (N gün)" başlığıyla, mevcut `mailBody` helper'ı kullanılır.

## 9. Kod Sağlığı — `persistMaint` Merkezileştirme

Şu an `maintenances` koleksiyonuna 5 farklı yerden (`saveMaint`, `maintVisitDone`, `maintDone`, `maintAddManualHistory`, ve yeni backfill akışı) ayrı ayrı `saveDoc` + `state.maintenances` güncellemesi yapılıyor. Görev senkronunu her yere tek tek eklemek yerine, ortak bir `async function persistMaint(data)` yardımcı fonksiyonu eklenir: `saveDoc` + state listesi güncelle + `maintSyncTask(data)` çağır + `data` döndür. Mevcut 5 çağrı noktası bu fonksiyona yönlendirilir (kendi toast/modal-kapama mantıkları korunarak). Bu, görev senkronunun gelecekte yeni bir kayıt yolunda unutulmasını yapısal olarak engeller.

## 10. Kapsam Dışı (bu turda yapılmayacak)

- Müşteriye giden ayrı hatırlatma maili (yalnız dahili personel/admin hedefleniyor).
- Tüm işlerin bakım tarihlerini tek takvim görünümünde gösteren yeni admin ekranı (mevcut Periyodik Bakım listesi + görev listesi yeterli görülüyor).
- Legacy tek-periyot (`mtPeriod`/`computeNextDue`) kayıtlara program/rozet/kaçıncı-bakım özelliklerinin taşınması — yalnız çok-sistemli (`mtSystems`) kayıtlar kapsamda.

## 11. Doğrulama

- JS syntax: `node vm.Script` → `✅ SYNTAX OK` (her değişiklikten sonra, CLAUDE.md komutu).
- `npx tsc --noEmit` (nextaura-admin, §8 değişikliği için).
- Manuel mantık kontrolü: base+end+freq gir → schedule doğru → bir occurrence'ı geri dönük tamamla → doneCount ilerler, sonraki tarihler değişmez → due'yu elle 5 gün kaydır → rozet çıkar → mtNextDue değişince görev dueDate güncellenir → serviceContact değiştir → görev yeni kişiye geçer + bildirim + assignmentHistory kaydı → maintenances kaydı sil → bağlı auto-task silinir.
