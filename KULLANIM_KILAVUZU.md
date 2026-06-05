# A-PRO Mühendislik — CRM & Teklif Programı Kullanım Kılavuzu

> **Sistemler:** A-PRO CRM (Nexora) · A-PRO Teklif Programı  
> **Güncellenme:** Haziran 2026 — v2.7

---

## Hangi Sistem Ne İçin?

| A-PRO CRM (Nexora) | A-PRO Teklif Programı |
|---|---|
| Müşteri ilişkileri takibi | Detaylı mühendislik teklifi hazırlama |
| Satış fırsatı yönetimi | Kalem kalem fiyatlandırma |
| Teklif talep takibi | Revizyon ve onay süreci |
| Randevu & ziyaret kaydı | PDF çıktı ve arşiv |
| Servis & bakım takibi | Teklif numaralandırma |
| AI otomatik yönetici raporu | Boru/fittings otomatik hesaplama |
| **Giriş:** apromuh-gif.github.io/A-PRO-CRM | **Giriş:** apro-platform.vercel.app |

**Temel kural:** Müşteri ilişkisini CRM'den yönetin, teklifin içeriğini Teklif Programı'ndan hazırlayın. İki sistem birbirine bağlıdır — CRM'den "Teklif Oluştur" butonuna basıldığında Teklif Programı'na **otomatik giriş yapılır**, ayrıca şifre girmek gerekmez.

---

## BÖLÜM 1 — A-PRO CRM (Nexora)

### 1.1 Giriş

1. `apromuh-gif.github.io/A-PRO-CRM` adresine gidin (veya ana ekrana eklenmiş PWA'yı açın)
2. Kullanıcı adı ve şifrenizle giriş yapın
3. Ana ekranda üst sekme çubuğu görünür

> 💡 **Teklif Programı'na ayrı giriş gerekmez.** CRM'deki "Teklif Oluştur" butonuna bastığınızda sistem sizi Teklif Programı'na otomatik olarak oturum açık şekilde yönlendirir.

---

### 1.2 Dashboard

Açılış ekranı. Tek bakışta özet bilgi:

- **Pipeline Değeri** — Aktif fırsatların toplam tutarı
- **Bu Ay Hedef** — Yıllık hedefin aylık dağılımı ve gerçekleşme
- **Fırsat Dağılımı** — Kazanıldı / Devam Eden / Kaybedilen pasta grafik
- **Yaklaşan Randevular** — Bugün ve bu haftaki randevular
- **Bildirimler** (sağ üst zil) — Size atanan görevler ve sistem bildirimleri

**Dashboard türleri** (Araçlar menüsünden seçilebilir):
- **Yönetici:** KPI kartları, pipeline değeri, win rate
- **Satış/Proje:** Temsilci performansı, hit rate, teklif başarı oranı
- **Pazarlama:** Aylık müşteri kazanım trendi

---

### 1.3 Müşteriler

**Yeni müşteri eklemek:**
1. `👥 Müşteriler` sekmesine gidin
2. `+ Yeni Firma` butonuna tıklayın
3. Firma adı, telefon, e-posta, web sitesi ve sektör bilgilerini doldurun
4. `Kaydet` — kayıt Firebase'e anında yazılır

**Müşteri kartında neler var:**
- İletişim bilgileri
- `💬` butonu — WhatsApp'a direkt bağlantı (telefon girilmişse)
- `📋 Teklif Oluştur` — müşteri için yeni teklif başlatır (otomatik giriş ile)
- `Düzenle` — bilgileri güncelleyin (güncelleme Teklif Programı'na da yansır)

> ⚠️ **Önemli:** Telefon veya e-posta girili müşteriler Teklif Programı ile daha sağlıklı eşleşir. Mümkün olduğunda doldurun.

---

### 1.4 Fırsatlar

Satış sürecindeki her iş için bir fırsat açılır.

**Yeni fırsat eklemek:**
1. `🎯 Fırsatlar` sekmesi → `+ Yeni Fırsat`
2. Başlık, müşteri, tahmini değer (EUR) ve aşama seçin
3. Sorumlu kişiyi atayın

**Fırsat Aşamaları:**

| Aşama | Anlamı |
|---|---|
| SICAK-1 | İlk temas, ilgi var — 1 ay içinde sonuçlanacak |
| SICAK-2 | Görüşmeler ilerledi — 3 ay içinde sonuçlanacak |
| TEKLİF | Teklif hazırlanıyor veya gönderildi |
| ERTELENDİ | Geçici duraksama |
| KAZANILDI | Sözleşme imzalandı ✓ |
| KAÇTI | Rakibe gitti |
| NO GO | Proje ile ilgilenmiyoruz |
| FIRSAT ÖLDÜ | İptal / geçersiz |

**Fırsat satırındaki butonlar:**

| Buton | Ne zaman görünür | Ne yapar |
|---|---|---|
| `📋 Teklif Oluştur` | Teklif henüz oluşturulmamışsa | Teklif Programı'nı açar (otomatik giriş + format seçimi) |
| `🔗 Teklif Programı` | Teklif oluşturulmuşsa | Mevcut teklifi doğrudan açar |
| `💬` | Her zaman | Müşteriye WhatsApp |
| `Düzenle` | Her zaman | Fırsat bilgilerini güncelle |
| `Sil` | Her zaman | Fırsatı sil |

---

### 1.5 Teklif Talepleri

CRM'deki teklifler, müşteriden gelen **teklif taleplerinin takibidir** — teklifin kalemleri burada değil, Teklif Programı'nda hazırlanır.

**Teklif Talebi Statüleri:**

| Statü | Ne anlama gelir |
|---|---|
| Hazırlanıyor | Teklif üzerinde çalışılıyor |
| Gönderildi | Müşteriye iletildi |
| Revize | Müşteri revizyon istedi |
| Randevu | Yüz yüze görüşme planlandı |
| Onaylandı | Müşteri kabul etti |
| Reddedildi | Müşteri reddetti |

> ℹ️ Teklif Programı üzerinden teklif oluşturulduğunda bu sekmede otomatik kayıt açılır ve `🔗 Teklif Programı` butonu eklenir.

**Yeni teklif talebi manuel eklemek:**
1. `+ Yeni Teklif` butonuna tıklayın
2. Başlık, müşteri, hazırlayan ve son tarih girin
3. Statüyü takip edin, değiştikçe güncelleyin

---

### 1.6 Randevular

Müşteri toplantıları, saha ziyaretleri ve görüşmeler için.

**Yeni randevu:**
1. `📅 Randevular` sekmesi → `+ Yeni Randevu`
2. Müşteri, tarih, saat ve sorumlu kişiyi seçin
3. Randevu statüleri: `Planlandı → Tamamlandı / Ertelendi / İptal`

> Yaklaşan randevular Dashboard'da ve bildirimler bölümünde görünür.

---

### 1.7 Ziyaretler

Saha ziyareti notları. Müşteri ziyaret edildiğinde kayıt açın.

> ⚠️ Ziyaret notu girilmezse ertesi gün 14:00'da sorumluya sesli ve mail hatırlatma gönderilir.

---

### 1.8 Servis & Bakım

- **Servis:** Tek seferlik teknik servis işleri (arıza giderme, kurulum, vs.)
- **Bakım:** Periyodik bakım sözleşmeleri

Her iki modülde de müşteri, sorumlu kişi, tutar ve tamamlanma durumu takip edilir.

---

### 1.9 Bildirim Sistemi

Sistem her 60 saniyede yaklaşan olayları kontrol eder ve sesli + mail bildirim gönderir.

**Sesli Bildirimler:**

| Tetikleyici | Zaman | Kime |
|---|---|---|
| Yarın randevu var | 16:30 | Sorumlu + Admin |
| Bugün randevu | 90 dk önce | Sorumlu + Admin |
| Ziyaret notu girilmedi | +1 gün 14:00 | Sorumlu |
| Fırsat sipariş tarihi 7 gün | 09:00 | Sorumlu |
| Fırsat 10+ gün güncellenmedi | Pazartesi 09:00 | Sorumlu + Admin |
| Teklif dead line 1 gün | 08:00 | Hazırlayan |
| Bakım 7 gün kaldı | 09:00 | Sorumlu |

---

### 1.10 Araçlar Menüsü

Üst çubukta **Araçlar ▾** menüsü:

| Araç | Ne yapar |
|---|---|
| **Aylık Rapor** (AI) | Groq AI ile son 30 günün yönetici raporu |
| **3 Aylık Rapor** (AI) | Groq AI ile çeyreklik analiz |
| **Geçmiş Raporlar** | Önceki AI raporlarını görüntüle |
| **İçe Aktar** | Excel/CSV ile toplu müşteri veya fırsat yükle |
| **Yedekleme** | Tüm veriyi JSON olarak indir veya geri yükle |
| **Yazdır** | Mevcut ekranı yazdır |

> 💡 AI raporlar tamamen otomatiktir. Firebase'deki tüm veri Groq'a gönderilir ve Türkçe yönetici raporu oluşturulur. Groq API anahtarı `Ayarlar`dan girilir.

---

## BÖLÜM 2 — A-PRO Teklif Programı

### 2.1 Giriş

**Önerilen yol:** CRM'den "Teklif Oluştur" butonuna basın — Teklif Programı yeni sekmede **otomatik giriş yapılmış şekilde** açılır.

**Doğrudan erişim:** `apro-platform.vercel.app` adresine gidin ve kullanıcı hesabınızla giriş yapın.

> 🔐 **Kullanıcı erişimi:** CRM'de kayıtlı her kullanıcı Teklif Programı'na da erişebilir. CRM'den silinen bir kullanıcının Teklif Programı erişimi de otomatik olarak kaldırılır.

---

### 2.2 Teklif Oluşturma

**CRM üzerinden (önerilen yol):**
1. CRM'de fırsatı bulun
2. `📋 Teklif Oluştur` butonuna tıklayın
3. **Teklif formatı seçin** (bir kez seçilir, sonradan değiştirilemez):

| Format | Ne zaman kullanılır |
|---|---|
| **Sistem Satış** | Malzeme ve Sistem Satışı |
| **Birim Fiyatlı** | Metraj bazlı boru fiyatlandırması, otomatik fittings hesabı |
| **Sistem Master** | Çok bölümlü büyük projeler için ana şablon |

4. Teklif Programı açılır — müşteri zaten kayıtlı, proje adı fırsat başlığından gelir
5. Kalemleri ekleyin, fiyatları girin

**Doğrudan Teklif Programı'ndan:**
1. Sol menüden `Teklifler` → `+ Yeni Teklif`
2. Müşteriyi seçin veya oluşturun
3. Proje adı, para birimi ve formatı seçin

---

### 2.3 Teklif Yapısı

```
Teklif (Quotation)
  └── Revizyon (Revision)  ← fiyatlar burada
        └── Bölüm A: Malzeme
        └── Bölüm B: İşçilik
        └── ... (ihtiyaca göre)
```

- Her teklif DRAFT olarak açılır
- Revizyon üzerinde çalışın, değişiklikler otomatik kaydedilir
- Onaylandığında statüsü APPROVED olarak değiştirilir

---

### 2.4 Para Birimi & Fiyatlandırma

- Teklif para birimi: EUR (varsayılan) — TRY ve USD de seçilebilir
- TCMB döviz kurları otomatik çekilir
- Liste çarpanı, KDV oranı ve işçilik markup sistem ayarlarından gelir, revizyon bazında değiştirilebilir

---

### 2.5 Teklif Silme Koruması

Teklif belirli bir statüye geçtikten sonra silinemez:

| Statü | Silinebilir mi |
|---|---|
| Taslak (DRAFT) | ✅ Evet — onay dialog'u çıkar |
| Gönderildi | 🔒 Hayır — korumalı |
| Revize | 🔒 Hayır — korumalı |
| Randevu | 🔒 Hayır — korumalı |
| Onaylandı | 🔒 Hayır — korumalı |
| Reddedildi | 🔒 Hayır — korumalı |

> Korumalı teklifi arşivlemek veya iptal etmek için sistem yöneticinize başvurun.

---

## BÖLÜM 3 — Entegrasyon: CRM'den Teklif Oluşturma

### 3.1 Fırsattan Teklif Oluşturma (Standart Akış)

```
1. CRM → Fırsatlar sekmesi
2. İlgili fırsatı bulun
3. Satır sonundaki [📋 Teklif Oluştur] butonuna tıklayın
   → Teklif formatı seçim ekranı açılır
4. Formatı seçin (Sistem Satış / Birim Fiyatlı / Sistem Master)
5. Teklif Programı yeni sekmede açılır (otomatik giriş)
   - Müşteri otomatik eşleştirilir (telefon/e-posta ile)
   - Proje adı fırsat başlığından gelir
   - DRAFT teklif hazır
6. Teklif kalemleri ve fiyatlar girilir
7. CRM'e dönün:
   - Fırsat satırında [🔗 Teklif Programı] linki görünür
   - Teklif Talepleri sekmesinde kayıt otomatik açılmıştır
```

---

### 3.2 Müşteri Kartından Teklif Oluşturma

Belirli bir fırsata bağlı olmayan, genel bir teklif için:

```
1. CRM → Müşteriler sekmesi
2. Müşteri kartındaki [📋 Teklif Oluştur] butonuna tıklayın
3. Teklif formatını seçin
4. Teklif Programı açılır (otomatik giriş), müşteri kaydı eşleştirilir
5. Proje adını Teklif Programı'nda kendiniz yazın
```

---

### 3.3 Mevcut Teklifi Açma

Fırsata teklif zaten oluşturulmuşsa:
- Fırsat satırında `📋 Teklif Oluştur` yerine `🔗 Teklif Programı` linki görünür
- Tıklayarak doğrudan ilgili teklifi açın (otomatik giriş ile)

Teklif Talepleri sekmesinde:
- Her satırdaki `🔗 Teklif Programı` butonu ilgili teklifi açar

---

### 3.4 Mükerrer Teklif Koruması

Aynı fırsat için `📋 Teklif Oluştur` butonuna tekrar basılırsa sistem uyarı verir:

```
"Bu fırsat için zaten bir teklif oluşturulmuş: [başlık]
Mevcut teklifi açmak ister misiniz?

Tamam = Mevcut teklifi aç
İptal = Yine de yeni teklif oluştur"
```

Genellikle **Tamam** seçin — aynı fırsat için çift teklif oluşturmaktan kaçının.

---

### 3.5 Müşteri Güncellemesi

CRM'de bir müşterinin telefon veya e-posta bilgisi güncellenip kaydedildiğinde, Teklif Programı'ndaki ilgili müşteri kaydı da otomatik güncellenir. Ayrıca bir şey yapmanıza gerek yoktur.

---

### 3.6 Kullanıcı Erişim Yönetimi (Admin)

CRM ve Teklif Programı kullanıcıları birbirine bağlıdır:

| Durum | CRM | Teklif Programı |
|---|---|---|
| CRM'e yeni kullanıcı eklendi | ✅ Giriş yapabilir | ✅ Otomatik erişim açılır |
| CRM kullanıcısı silindi | ❌ Giriş yapamaz | ❌ Erişim otomatik kaldırılır |

> Teklif Programı kullanıcısının şifre girmesine gerek yoktur — tüm erişim CRM üzerinden SSO ile sağlanır.

---

## BÖLÜM 4 — Sık Kullanılan İş Akışları

### Yeni müşteri → fırsat → teklif

```
1. Müşteriler → + Yeni Firma (telefon ve e-posta girin)
2. Fırsatlar → + Yeni Fırsat (müşteriyi seçin, aşama: SICAK-1)
3. Fırsat satırı → 📋 Teklif Oluştur → Format seç
4. Teklif Programı'nda kalemleri girin (otomatik giriş)
5. Teklifi müşteriye gönderin
6. CRM → Fırsatı güncelle: aşama → TEKLİF
7. Teklif onaylandığında: aşama → KAZANILDI
```

---

### Gelen teklif talebi takibi

```
1. Müşteri teklif istedi (telefon/e-posta)
2. Teklif Talepleri → + Yeni Teklif
   - Başlık: "ACME — HVAC Teklifi"
   - Statü: Hazırlanıyor
3. Teklif hazırlandığında fırsattan Teklif Oluştur'a bas → Format seç
4. Teklif Talebi kaydı otomatik güncellenir (🔗 link eklenir)
5. Statüyü → Gönderildi olarak güncelleyin + gönderim tarihini girin
6. Müşteriden yanıt gelince → Onaylandı veya Reddedildi
```

---

### Revizyon talebi

```
1. Teklif Talepleri → ilgili kaydı Düzenle → Statü: Revize
2. Teklif Programı'nda 🔗 bağlantısıyla teklifi açın (otomatik giriş)
3. Yeni revizyon oluşturun, değişiklikleri yapın
4. Teklifi tekrar gönderin → Statü: Gönderildi
```

---

## BÖLÜM 5 — Sık Sorulan Sorular

**S: Teklif Programı'na ayrı giriş yapmam gerekiyor mu?**  
C: Hayır. CRM'de "Teklif Oluştur" butonuna bastığınızda sistem sizi Teklif Programı'na otomatik olarak oturum açık şekilde yönlendirir. Ayrıca şifre girmenize gerek yok.

**S: Teklif Programı'nda müşteriyi bulamıyorum.**  
C: Müşteri, CRM'de telefon veya e-posta girilmeden kaydedilmiş olabilir. CRM'de müşteri kartını düzenleyip telefon/e-posta ekleyin, kaydedin. Sonraki teklif oluşturmada otomatik eşleşir.

**S: Aynı fırsat için yanlışlıkla 2 teklif oluşturdum.**  
C: Teklif Programı'nda DRAFT durumundaki fazla teklifi silin. Doğru teklif olan `🔗 Teklif Programı` linkiyle açılan tekliftir (fırsat satırında görünür).

**S: Fırsat satırında `🔗 Teklif Programı` butonu yok, `📋 Teklif Oluştur` var.**  
C: Bu fırsata henüz teklif oluşturulmamış demektir. Butona tıklayarak oluşturun.

**S: Teklif Talebi statüsü otomatik güncelleniyor mu?**  
C: Hayır, şu an statü otomatik güncellenmez. Teklif gönderildiğinde, onaylandığında veya reddedildiğinde CRM'den manuel güncelleyin.

**S: Teklif Programı'nda EUR yerine TRY kullanabilir miyim?**  
C: Evet, teklif oluştururken para birimi seçilebilir. TCMB kuru üzerinden otomatik dönüşüm yapılır.

**S: Birden fazla revizyon olduğunda hangi fiyat geçerli?**  
C: Teklif Programı'nda en son aktif revizyon geçerlidir. Önceki revizyonlar arşivde saklanır.

**S: Teklifi silmeye çalışıyorum ama "korumalı" diyor.**  
C: Gönderildi, Revize, Randevu, Onaylandı veya Reddedildi statüsündeki teklifler silinemez. Yanlışlıkla bu statüye geçirilmişse sistem yöneticinize başvurun.

**S: Teklif formatını sonradan değiştirebilir miyim?**  
C: Hayır. Format teklif oluşturulurken bir kez seçilir ve değiştirilemez. Yanlış format seçildiyse DRAFT teklifte yeni bir teklif oluşturup eskisini silin.

**S: CRM kullanıcısı silindikten sonra Teklif Programı'na girebilir mi?**  
C: Hayır. CRM'den silinen kullanıcının Teklif Programı erişimi otomatik olarak kaldırılır.

---

*Teknik destek için sistem yöneticinize başvurun.*
