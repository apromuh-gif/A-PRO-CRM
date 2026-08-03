# NFPA 25 Tabanlı Servis Checklist / Form Sistemi (Tasarım / Spec)

**Tarih:** 2026-08-03
**Kapsam:** A-Pro yangın koruma hizmetlerinde (Devreye Alma · Periyodik Bakım · Arıza) sistem-bazında, standart-temelli, Türkçe, tik-işaretli, imzalı ve A-PRO logolu PDF çıktısı alınabilen checklist/form altyapısı. CRM (`APRO_CRM_Firebase.html`) içinde yaşar.
**Dışında:** Duman tahliye / yangın kapısı / taşınabilir söndürücü sistemleri; uygulama-içi şablon editörü; ayrı "bina/saha" modülü; Teklif Programı (Next.js) entegrasyonu.

---

## 1. Amaç ve Bağlam

A-Pro'nun verdiği test/devreye alma, periyodik bakım ve arıza hizmetlerinde, yapılan kontrollerin **standart gereğince** (NFPA 25 ve ilgili standartlar) belgelenmesi; her maddenin **tik** ile değerlendirilmesi; formun hem **A-Pro personeli** hem de **müşteri** tarafından imzalanması gerekir. İmza **hukuki sebeplerle ıslak** olmalıdır; dijital imza da kayıt olarak tutulur. Çıktı, Teklif Programı PDF ön izlemesindeki **A-PRO logosu ve A4 sayfa yapısı** görünümünde olmalıdır.

Checklist **sistem bazındadır** (sprinkler, pompa, hidrant+dolabı, su deposu, köpük, algılama, gazlı, davlumbaz). Bir saha ziyaretinde birden çok sistem olabilir; hepsi tek formda toplanır. Periyodik bakımda her sistemin **kaç ayda bir** yapılacağı formda görünür.

## 2. Yerleşim Kararı (R1)

**CRM içinde (Seçenek A).** Gerekçe: saha personeli müşteri/servis/bakım kaydına zaten CRM'den ulaşıyor; CRM'de kanıtlanmış yazdırma altyapısı (`print-overlay` + `window.print()`) ve **gömülü A-PRO SVG logosu** (satır 11) mevcut; Teklif Programı ile entegrasyon/senkron riski gerekmez. Tek maliyet: Teklif PDF görünümü CRM'de yeniden kurulur (logo elde olduğu için görsel eşdeğer).

## 3. Çıpa ve İlişki Modeli (R2)

- **Gerçek çıpa: müşteri + serbest "Saha / Bina adı" alanı.** Aynı müşterinin birden çok binası olabilir; geçmiş yıllardan gelen, bu programla oluşturulmamış sahalar da müşteri + saha adı ile tanımlanır. Ayrı "bina" modülü kurulmaz (YAGNI).
- **Kayıt bağı (opsiyonel):** Periyodik bakım ve arıza checklist'i ilgili `maintenances` / `services` kaydına bağlanır (`linkType`/`linkId`). Devreye alma tercihen projeye (`projectId`) bağlanır; **proje yoksa doğrudan müşteriye açılır**, proje bağı boş kalır. Böylece geçmiş/dış projeler dahil hiçbir saha dışarıda kalmaz.

## 4. Üç Form Tipi (R3)

Üç hizmet standart açısından farklıdır; **aynı checklist tekrarı değil, üç ayrı şablon** kullanılır:

| formType | Ad | Nitelik | Standart temeli | Bağ |
|---|---|---|---|---|
| `devreye` | Test / Devreye Alma | Tek seferlik kabul testi (hidrostatik, flushing, ana drenaj, fonksiyon testi, pompa performans eğrisi) | NFPA 13/20/72 kabul testleri | Proje (ops) / müşteri |
| `bakim` | Periyodik Bakım (ITM) | Tekrarlayan; frekans-etiketli | NFPA 25 (su bazlı) + 72/2001/96 | `maintenances` |
| `ariza` | Arıza / Düzeltici Servis | Reaktif; kısa form | — (arıza→işlem→parça→tekrar test→sonuç) | `services` |

## 5. Frekans Mantığı — NFPA 25 Doğru (R4)

NFPA 25'te frekans **sistem değil komponent** bazındadır (örn. sprinkler: manometre haftalık/aylık, kontrol vanaları aylık, alarm cihazları 3 aylık, başlık/boru yıllık, iç boru muayenesi 5 yıllık).

- Her **madde** bir `freq` etiketi taşır: `haftalik` / `aylik` / `3aylik` / `6aylik` / `yillik` / `5yillik`.
- `bakim` formunda ziyaret frekansı seçilir → form **"bu ziyarette yapılması gerekenleri"** (seçilen frekans ve daha sık olanlar) filtreler.
- Her sistem **kendi vadesini** taşır (`visitFreq` + hesaplanan sonraki vade). Aynı sahada pompa aylık, sprinkler yıllık ayrı ayrı takip edilir.
- `devreye` ve `ariza` formlarında frekans filtresi yok; maddeler tek liste.

## 6. İçerik Kaynağı — Gömülü Şablonlar (R5)

**Seçenek A: kod içine gömülü Türkçe şablonlar.** NFPA temelli madde listeleri sistem × formType matrisinde tanımlanır. Personel yalnız tikler; uygulama-içi editör yok (ileride "C — karma override"a taşınabilecek veri yapısı kurulur).

Katılığı gideren üç mekanizma:
1. **3 durumlu tik:** `uygun` (✔) · `uygundegil` (✗ eksik/arıza) · `na` (bu sahada yok/uygulanamaz) + serbest not. Olmayan komponent **N/A** işaretlenir (denetimde "atlandı mı, yok mu" belli olur; hukuki olarak bilinçli değerlendirme sayılır).
2. **Alt-tip dallanması:** maddesi çok değişen sistemlerde seçimde alt-tip sorulur (örn. Sprinkler → Islak / Kuru / Ön tepkili) → yalnız o alt-tipin maddeleri yüklenir; gereksiz N/A yığını olmaz.
3. **Escape hatch:** her sistem bölümünde serbest **"Ek maddeler / saha notu"** alanı; şablonda olmayan saha kontrolü elle yazılır.

## 7. v1 Sistem Kapsamı (R6)

| # | sysKey | Ad | Alt-tip | Standart |
|---|---|---|---|---|
| 1 | `sprinkler` | Sprinkler | Islak / Kuru / Ön tepkili | NFPA 25 |
| 2 | `pompa` | Yangın pompası (dizel+elektrik+jokey) | — | NFPA 25/20 |
| 3 | `hidrant_dolap` | Hidrant + Yangın dolabı (iki alt-grup, tek checklist) | — | NFPA 25 |
| 4 | `su_deposu` | Su deposu (modüler/betonarme) | — | NFPA 25 |
| 5 | `kopuk` | Köpüklü söndürme | — | NFPA 25/11 |
| 6 | `algilama` | Yangın algılama & alarm | — | NFPA 72 |
| 7 | `gazli` | Gazlı söndürme (FM-200/Novec/CO₂/IG-541) | — | NFPA 2001/12 |
| 8 | `davlumbaz` | Davlumbaz / mutfak söndürme | — | NFPA 96/17A |

**Uygulama sırası (dalga dalga):** önce su bazlı 1–5, sonra 6–8. Spec tümünü kapsar; plan dalgalara böler.

## 8. Veri Modeli — `checklists` Koleksiyonu

Yeni Firestore koleksiyonu. Okuma-anı default deseni (Faz 2/3a/3b ile aynı; eksik alanlar erişimde default'lanır).

```
checklist = {
  id,
  formType,            // 'devreye' | 'bakim' | 'ariza'
  customerId,
  siteName,            // serbest "Saha / Bina adı"
  projectId,           // ops — devreye alma için, yoksa ''
  linkType,            // '' | 'maintenance' | 'service'
  linkId,              // ilgili kayıt id'si (ops)
  systems: [
    {
      sysKey,          // 'sprinkler' vb.
      subType,         // 'islak' | 'kuru' | 'ontepkili' | ''
      visitFreq,       // 'bakim' için: 'aylik' vb.; diğerinde ''
      nextDue,         // 'bakim' için hesaplanan sonraki vade (ISO); diğerinde ''
      items: [ { kod, label, freq, result, note } ],   // result: 'uygun'|'uygundegil'|'na'|''
      extraNotes       // serbest ek madde/saha notu
    }
  ],
  staffSign: { name, dataURL, at },   // personel imzası (canvas)
  custSign:  { name, dataURL, at },   // müşteri imzası (canvas)
  status,              // 'taslak' | 'tamam'
  createdAt,
  _editedBy, _editedAt
}
```

## 9. Erişim & Yardımcı Fonksiyonlar

- `CHECKLIST_TEMPLATES[formType][sysKey]` (+ alt-tip) → `{ freq, label, kod }[]` gömülü şablonlar.
- `clItems(formType, sysKey, subType)` — güvenli şablon okuma.
- `clVisitItems(system, formType)` — `bakim`'de `visitFreq`e göre filtreli madde listesi (seçilen frekans ve daha sık olanlar).
- `clComputeNextDue(baseISO, visitFreq)` — Faz 3b `_addMonth`/`computeNextDue` desenini kullanır.
- `clSave(checklist)` — `saveDoc('checklists', id, data)` + `state.checklists` güncelle + `_editedBy/_editedAt` damgası (Faz 3b `saveMaint` deseni).
- `clDelete(id)` — kayıt silme (bağlı kayıt/görev yok; cascade gerekmez).
- Not: accessor'lar const'lardan önce tanımlanırsa `typeof X!=='undefined'` guard'ı (Faz 2/3a/3b deseni).

## 10. UI

- **Giriş noktaları:** Teknik Servis kartı → "📋 Arıza Checklist"; Periyodik Bakım kartı → "📋 Bakım Checklist"; Proje kartı (veya müşteri) → "🧪 Devreye Alma Checklist".
- **Doldurma ekranı (mobil uyumlu, tam ekran):** başlık (müşteri + saha adı + formType) → **sistem ekle** (dropdown; alt-tip sorulur; `bakim`'de `visitFreq` seçilir) → her sistem için frekans-filtreli tik tablosu (✔/✗/N/A + not) → serbest ek madde alanı → imza bölümü.
- **İmza:** iki `<canvas>` (personel + müşteri); parmak/kalemle çizilir; `toDataURL()` ile forma gömülür. İsim + tarih.
- **Kayıt listesi:** ilgili kayıt modalında / müşteri altında "Checklist'ler" — PDF / Düzenle / Sil.

## 11. PDF Çıktısı

- Mevcut `print-overlay` (tam ekran div) + `window.print()` deseni (bkz. `printPrimBordro`).
- **Gömülü A-PRO SVG logosu** (satır 11) kullanılır; A4 sayfa yapısı: kapak (logo, başlık `A-PRO ... FORMU`, müşteri/saha/tarih/formType) → her sistem için bölüm başlığı + tik tablosu (Madde · Frekans · Sonuç · Not) → sonda **tek imza bloğu** (personel + müşteri): dijital imza görseli + **ıslak imza satırları** (ad-soyad, tarih, imza).
- `@media print` ile buton/gölge gizlenir; `escapeHtml` ile güvenli metin.

## 12. Yetkiler

- Checklist doldurma + imza + PDF → **herkes**.
- Silme → oluşturan veya **admin** (Faz 3a/3b silme deseni).

## 13. Doğrulama

- JS syntax: `bash docs/superpowers/tests/syntax.sh` → `✅ SYNTAX OK` (her HTML değişikliğinden sonra).
- Manuel tarayıcı: kayıt → checklist doldur → sistem ekle (alt-tip + frekans) → `bakim`'de frekans filtresi doğru → tik/N/A → ek not → iki imza (canvas) → kaydet (Firestore + state) → PDF (A-PRO logolu A4, imza blokları, ıslak imza satırları) → düzenle/sil → geçmiş projede (proje bağı boş) müşteri+saha ile doldurma.

## 14. Kapsam Dışı (net sınır)

- Duman tahliye / basınçlandırma, yangın kapıları / pasif durdurma, taşınabilir söndürücü/tüpler.
- Uygulama-içi şablon editörü (ileride "C — karma override").
- Ayrı "bina/saha" varlık modülü.
- Teklif Programı (Next.js) entegrasyonu / oradaki PDF motorunun ortak kullanımı.
- Frekans-bazlı otomatik bildirim/mail (Faz 3b bakım vade bildirimleri ayrı; bu spec yalnız form/çıktı).
