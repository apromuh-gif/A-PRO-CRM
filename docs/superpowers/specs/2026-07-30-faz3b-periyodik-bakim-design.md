# Faz 3b — Periyodik Bakım Takip (Tasarım / Spec)

**Tarih:** 2026-07-30
**Kapsam:** `maintenances` (Periyodik Bakım) koleksiyonu üzerine tekrar/vade (recurrence / due-date) takibi.
**Dışında:** `services` arıza icrası (Faz 3a — tamamlandı), `serviceOpps` servis satış pipeline (dokunulmaz), yapısal parça/stok/maliyet modülü.

---

## 1. Amaç ve Bağlam

A-Pro yangın koruma mühendisliğinde periyodik bakım **yasal zorunlu ve tekrarlayan** bir yükümlülüktür (BYKHY). Arıza (Faz 3a) reaktif ve tek seferlikken, bakım proaktif ve döngüseldir: her tamamlanan bakım bir sonraki vadeyi doğurur. Kaçırılan bir bakım = **can riski + hukuki risk + kaybedilen tekrar geliri**.

Bu faz, Faz 2/3a'daki aşama motoru desenini **taşımaz** (bakımda doğrusal aşama yoktur); bunun yerine **vade/tekrar (due-date/recurrence)** eksenine odaklanır. Faz 3 iki seri işe ayrılmıştı: **Faz 3a = Arıza (services)** doğrusal aşama motoru (tamamlandı); **Faz 3b = Periyodik bakım (maintenances)** tekrar/vade takibi (bu doküman).

## 2. Mevcut Model ve Kısıtlar

`maintenances` kaydı mevcut alanları: `jobName / customerId / serviceContact / amount / status / appointmentStart / appointmentEnd / notes / tenderRef / createdAt / _editedBy / _editedAt`.

- **Durum ekseni ikili:** `MAINT_ST = ["Hizmet Verildi","Hizmet Henüz Verilmedi"]` (satır 93), renk `MS` (satır 97). Bu eksen **korunur**, bozulmaz.
- **ORTAK koleksiyon:** `maintenances` mali-yıl merceğine tabi **değildir** → `filterFY` **uygulanmaz** (Faz 3a `services`'in aksine).
- `appointmentStart/appointmentEnd` = tek seferlik **Randevu Tarihi Aralığı** (planlanan ziyaret penceresi). Bu, tekrarlayan vade ile **karışmamalı** (§4).

## 3. Veri Modeli

`maintenances` kaydına, **okuma anında default'lanan** (erişildiğinde eklenen, mevcut kayıtları bozmayan) alanlar:

| Alan | Tip | Default | Açıklama |
|---|---|---|---|
| `mtPeriod` | string | `''` | Periyot: `''`/`aylik`/`3aylik`/`6aylik`/`yillik`/`ozel` |
| `mtPeriodDays` | number | `0` | `mtPeriod==='ozel'` iken gün cinsinden periyot |
| `mtNextDue` | string(ISO) | `''` | Bir sonraki bakım vadesi (hesaplanan) |
| `mtLastDone` | string(ISO) | `''` | Son yapılan bakım tarihi |
| `mtHistory` | array | `[]` | `{at, by, note}` tamamlanan bakım kayıtları |

Normalizasyon: Faz 2/3a erişim-anı default deseni. `maintenances` okunurken bu alanlar yoksa yukarıdaki default'larla tamamlanır (kalıcı yazma zorunlu değil; salt-okuma güvenli erişim fonksiyonları kullanılır).

**Mevcut `status` (Hizmet Verildi/Verilmedi) dokunulmaz**; vade ayrı eksendir.

## 4. Mükerrerlik Ayrımı — `appointmentStart` vs `mtNextDue` (kritik)

İki tarih ekseni **birlikte var olur, farklı anlam taşır**:

- `appointmentStart/appointmentEnd` = **tek seferlik planlanan ziyaret penceresi** (elle girilen randevu aralığı). Değişmez anlam.
- `mtNextDue` = **tekrarlayan hesaplanan vade** (periyottan otomatik türeyen sonraki bakım tarihi).

`mtNextDue` randevu alanlarını **ezmez/silmez**; ayrı yaşar. Kullanıcı isterse bir vade için ayrıca randevu aralığı girebilir.

## 5. Ölü Kod Tamiri — hatırlatma altyapısını `mtNextDue`'ya bağla (kritik)

Kodda mevcut ama **kayıtta olmayan alan okuduğu için çalışmayan** 2 hatırlatma tüketicisi var. Bunlar `mtNextDue` okuyacak şekilde **düzeltilir** (tek kaynak → ölü kod tamir edilir):

| Konum | Şu an okuyor (yok) | Düzeltme |
|---|---|---|
| Bildirim (satır ~8248) | `m.appointmentDate` | `m.mtNextDue` (7 gün önce uyarı) |
| E-posta (satır ~8600) | `m.appointmentDate` | `m.mtNextDue` (7 gün önce mail) |

**Karar (madde 2 / öneri b):** Oto-görev üreticisi (satır ~6705, `m.dueDate||m.nextDate` okuyan) **değiştirilmez** — bakımda görev motoru yok (Q2=C). Bakım hatırlatması yalnız bildirim + mail ile yapılır; bu blok olduğu gibi (ölü) bırakılır, `mtNextDue`'ya bağlanmaz.

## 6. Periyot Matematiği — `_addMonth` (Gap tamiri)

Takvim-doğru ay ekleme helper'ı **yok** (mevcut `_offsetDay` yalnız gün bazlı). Ay taşması riski (31 Oca + 1 ay).

Yeni helper: **`_addMonth(iso, n)`** — timezone-safe, ayın son gününü **clamp**'ler (31 Oca + 1 ay → 28/29 Şub). `_toDate` deseni izlenir.

`computeNextDue(baseISO, period, days)`:
- `aylik` → `_addMonth(base, 1)`
- `3aylik` → `_addMonth(base, 3)`
- `6aylik` → `_addMonth(base, 6)`
- `yillik` → `_addMonth(base, 12)`
- `ozel` → `_offsetDay` ile `base + days` gün
- geçersiz/boş → `''`

## 7. Erişim & Yardımcı Fonksiyonlar

- `maintPeriod(m)` / `maintNextDue(m)` / `maintLastDone(m)` / `maintHistory(m)` — güvenli okuma (default'lu).
- `maintIsTracked(m)` — `mtPeriod && mtNextDue` (Takipte tanımı).
- `computeNextDue(baseISO, period, days)` — §6.
- `maintDueStatus(m)` — `mtNextDue`'ya göre: `geciken` (vade < bugün) / `yaklasan` (0–15 gün) / `planli` (>15 gün) / `''` (takipte değil).
- `maintDaysLeft(m)` — `_diffDays(mtNextDue)`.
- `maintDone(m)` — tamamlama (§8).

Not: `maintDueStatus`/`computeNextDue` accessor'ları const'lardan (`MAINT_ST` vb.) önce tanımlanırsa `typeof X!=='undefined'` guard'ı kullan (Faz 2/3a deseni).

## 8. Tamamlama Akışı — `maintDone(m)`

1. Kısa not iste (prompt, opsiyonel).
2. `mtHistory` sonuna `{at: today(), by: aktifKullanıcı, note}` ekle.
3. `mtLastDone = today()`.
4. `mtNextDue = computeNextDue(today(), mtPeriod, mtPeriodDays)` (yeni döngü, bugünden ileri).
5. **Durum ekseni resetlenir:** `status = "Hizmet Henüz Verilmedi"` (yeni döngü başladı; "Verildi" kalıcı olmaz).
6. Kayıt: **`saveMaint` deseni** — `saveDoc('maintenances', id, data)` + `state.maintenances.map` güncelle + `_editedBy/_editedAt` damgası. (`personelSaveDoc` **kullanılmaz**; tutarlılık için `saveMaint` yolu.)

Görev motoru **yok**, cascade delete **gereksiz** (Q2=C).

## 9. UI

`renderMaintenances` (satır ~5716) ekranına görünüm sekmeleri:

- **Tümü** (mevcut liste — bozulmaz)
- **Yaklaşan** (`maintDueStatus==='yaklasan'`, ≤15 gün)
- **Geciken** (`maintDueStatus==='geciken'`, vade geçmiş — **kırmızı** vurgu)

`state.maintFilters` mevcut (q/job/cust) korunur; sekme için `state.maintTab:'tumu'` eklenir (PMOD default'a).

**`buildMaintModal` (satır ~1859) genişletir:**
- Periyot seçici (`aylik/3aylik/6aylik/yillik/ozel` + boş).
- `ozel` seçilince gün girişi (`mtPeriodDays`).
- İlk `mtNextDue` tarihi (elle set veya periyottan öneri).
- "✅ Bakımı Tamamla" butonu → `maintDone(m)` (yalnız takipteyken görünür).

**Satır aksiyonları (mevcut Düzenle/WhatsApp/Sil korunur):** takipteki kayıtlarda vade rozeti (geciken=kırmızı / yaklasan=turuncu / planli=yeşil) + "Tamamla" kısayolu.

**`buildBakimModal(maintId)`** — küçük geçmiş modalı: `mtHistory` listesi (tarih/kişi/not) + vade özeti. Modal dispatch'e `else if(type==='bakim') ...` eklenir.

Ekran başında tek cümlelik not: "Periyodik Bakım = yasal zorunlu tekrarlayan bakım vade takibi."

## 10. Yetkiler

- Periyot belirle + bakım tamamla → **herkes**.
- (Geri alma/döngü sıfırlama gibi admin-özel aksiyon bu fazda yok — YAGNI.)

## 11. Doğrulama

- JS syntax: `node vm.Script` → `✅ SYNTAX OK` (CLAUDE.md komutu).
- Manuel tarayıcı: periyot ata → `mtNextDue` hesaplanır → Tamamla → history eklenir + yeni vade + status "Verilmedi"ye döner → Yaklaşan/Geciken filtreleri doğru → geciken kırmızı → 7 gün önce bildirim/mail `mtNextDue`'dan tetiklenir → `_addMonth` ay-sonu clamp (31 Oca +1 ay = Şub sonu).

## 12. Kapsam Dışı (net sınır)

- Arıza icrası (Faz 3a — tamamlandı).
- `serviceOpps` / `services` değişiklikleri.
- ~~Oto-görev üreticisi aktivasyonu (madde 2 / öneri b — dokunulmaz).~~ **GEÇERSİZ — bkz. §13.**
- Aşama motoru / kanban (bakımda doğrusal aşama yok).
- Yapısal parça/stok/maliyet/fatura modülü.

## 13. Karar Revizyonu (2026-08-29)

§5'teki "oto-görev üreticisi dokunulmaz" kararı **tersine çevrildi**. Gerekçe: bu oturumda, tek kanala (bildirim+mail) güvenmenin canlıda sessizce başarısız olduğu tespit edildi (§5'teki `mtNextDue` bağlama hatası — mail hiç gitmiyordu). Yasal zorunlu/güvenlik kritik bir işte tek kanal yetersiz görüldü. Yeni tasarım: `docs/superpowers/specs/2026-08-29-periyodik-bakim-otomasyon-v2-design.md`.
