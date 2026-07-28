# NextAura — CRM & Teklif Programı Kullanım Kılavuzu

> **Sistemler:** NextAura CRM · NextAura Teklif Programı  
> **Güncellenme:** Haziran 2026 — v2.9

---

## Yenilikler — Haziran 2026 (v2.9)

NextAura artık firmanıza özel marka ile çalışır:

- **Firmanıza özel marka:** Kendi logonuzu ve firma bilgilerinizi yüklersiniz; PDF / Excel / ön izleme çıktıları firmanızın markasıyla üretilir.
- **Logo yüklenmemişse çıktıda hiç logo basılmaz** — başka bir firmanın logosu asla görünmez.
- **Veri ve personel gizliliği:** Yalnızca kendi müşterilerinizi, tekliflerinizi ve personelinizi (Satış Temsilcisi / Hazırlayan listesi) görürsünüz.
- **Yönetici erişimi:** Firmanızda bir kullanıcı **Yönetici** yetkisiyle "Ayarlar" menüsüne erişip logo ve firma bilgilerini düzenler.

> ℹ️ Firmanıza özel logo ve bilgi kurulumu için **BÖLÜM 6**'ya bakın.

---

## Hangi Sistem Ne İçin?

| NextAura CRM | NextAura Teklif Programı |
|---|---|
| Müşteri ilişkileri takibi | Detaylı mühendislik teklifi hazırlama |
| Satış fırsatı yönetimi | Kalem kalem fiyatlandırma |
| Teklif takibi ve durumu | Revizyon ve onay süreci |
| Randevu & ziyaret kaydı | PDF / Excel çıktı ve arşiv |
| Servis & bakım takibi | Boru/fittings otomatik hesaplama |
| AI otomatik yönetici raporu | Teklif numaralandırma |
| **Giriş:** crm.nextaura.tr | **Giriş:** CRM üzerinden tek tıkla (SSO) |

**Temel kural:** Müşteri ilişkisini CRM'den yönetin, teklifin içeriğini Teklif Programı'ndan hazırlayın. İki sistem tam entegredir — CRM'den "Teklif Oluştur" butonuna basıldığında Teklif Programı yeni sekmede **otomatik giriş yapılmış şekilde** açılır.

---

## STANDART SATIŞ AKIŞI (Adım Adım)

> Bu bölüm tipik bir satış sürecini baştan sona açıklar. Detaylar için ilgili bölümlere bakın.

### Adım 1 — Müşteri Ekle

1. `👥 Müşteriler` sekmesi → `+ Yeni Firma`
2. **Firma adı** (zorunlu), telefon ve e-posta girin
3. `Kaydet`

> ⚠️ Telefon veya e-posta girilmesi önerilir — Teklif Programı ile otomatik eşleşme için gereklidir.

---

### Adım 2 — Fırsat Ekle

1. `🎯 Fırsatlar` sekmesi → `+ Yeni Fırsat`
2. **Başlık** (proje/iş adı), **müşteri**, **tahmini değer (€)** ve **aşama** seçin
3. Sorumlu kişiyi atayın
4. `Kaydet`

---

### Adım 3 — Teklif Oluştur

1. Fırsatlar listesinde ilgili satırı bulun
2. Sağ taraftaki `📋 Teklif Oluştur` butonuna tıklayın
3. **Teklif formatını seçin** (sonradan değiştirilemez):

| Format | Ne zaman kullanılır |
|---|---|
| **Sistem Satış** | Standart malzeme ve sistem satış teklifi |
| **Birim Fiyatlı** | Metraj bazlı boru fiyatlandırması, otomatik fittings hesabı |
| **Sistem Master** | Çok bölümlü büyük projeler için ana şablon |

4. Teklif Programı yeni sekmede açılır — müşteri otomatik eşleştirilmiş, proje adı fırsat başlığından gelmiş, boş bir DRAFT teklif hazır

> 💡 CRM'e dönün: Fırsat satırındaki buton artık `✏️ Taslağı Aç` olarak güncellendi (amber/sarı renk).

---

### Adım 4 — Teklifi Hazırla (Teklif Programı'nda)

Teklif ekranındaki bölümler renk kodludur — her bölümün ne işe yaradığı renge göre kolayca ayırt edilir:

| Renk | Bölüm | Ne yapılır |
|---|---|---|
| 🔵 Açık Mavi | **Malzeme / Kalemler** | Ürün kalemleri eklenir, miktarlar ve fiyatlar girilir |
| 🟢 Koyu Yeşil | **Modüller** | Standart modül paketleri eklenir |
| 🟣 İndigo | **Proje Bilgileri** | Teklif referansı, müşteri ilgilisi, satış temsilcisi ve hazırlayan girilir |
| 🟠 Amber | **Ticari Açıklamalar** | Ödeme, teslim süresi ve garanti koşulları |

**Proje Bilgileri bölümünü mutlaka doldurun:**

1. **Teklif Referansı** → Teklif için dahili referans kodu (ör: `REF-2024-001`). Kaydedildiğinde CRM'deki fırsatın REF. alanına otomatik yansır.
2. **Müşteri İlgilisi** → Muhatap kişinin adı (ör: `Sn. Ali Yılmaz`). Teklif çıktısında görünür.
3. **Satış Temsilcisi** ve **Hazırlayan** → Sorumlu isimleri
4. `Kaydet` butonuna basın

---

### Adım 5 — CRM Otomatik Güncellenir

`✏️ Taslağı Aç` veya `🔗 Teklif Programı` butonuna her basıldığında CRM, Teklif Programı'ndan en güncel bilgileri çeker ve şunları otomatik günceller:

| Teklif Programı'ndaki Alan | CRM'de Nereye Yansır |
|---|---|
| Teklif Toplam Tutarı (`grandTotal`) | Fırsatın **Değer (€)** alanı |
| Teklif Referansı (`reference`) | Fırsatın **REF.** alanı |
| Teklif Durumu (`DRAFT` / `SENT` vb.) | Fırsat satırındaki **buton rengi ve etiketi** |

> Ayrıca bir işlem yapmanıza gerek yoktur — buton tıklandığında senkronizasyon otomatik gerçekleşir.

---

### Adım 6 — Teklifi Gönderin

1. Teklif Programı'nda teklifi PDF/Excel olarak indirin veya müşteriye e-posta ile gönderin
2. Teklif durumu DRAFT → SENT olarak güncellenir
3. CRM'e dönün: Fırsat satırındaki buton artık `🔗 Teklif Programı` (mavi) olur

---

### Adım 7 — Sonucu Güncelleyin

Müşteriden yanıt geldiğinde:
- **Onaylandı:** CRM'de fırsat aşamasını `KAZANILDI` olarak güncelleyin
- **Reddedildi:** Aşamayı `KAÇTI` veya `NO GO` yapın
- **Revizyon istediyse:** Teklif Programı'nda yeni revizyon oluşturun, CRM'de statüyü `Revize` yapın

---

## BÖLÜM 1 — NextAura CRM

### 1.1 Giriş

1. `crm.nextaura.tr` adresine gidin (veya ana ekrana eklenmiş PWA'yı açın)
2. Kullanıcı adı ve şifrenizle giriş yapın
3. Ana ekranda üst sekme çubuğu görünür

> 💡 **Teklif Programı'na ayrı giriş gerekmez.** CRM'deki teklif butonlarına bastığınızda sistem sizi Teklif Programı'na otomatik olarak oturum açık şekilde yönlendirir.

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
| SICAK-1 | 1 ay içinde sonuçlanacak |
| SICAK-2 | 3 ay içinde sonuçlanacak |
| TEKLİF | Teklif hazırlanıyor veya gönderildi |
| ERTELENDİ | Geçici duraksama |
| KAZANILDI | Sözleşme imzalandı ✓ |
| KAÇTI | Rakibe gitti |
| NO GO | Proje ile ilgilenmiyoruz |
| FIRSAT ÖLDÜ | İptal / geçersiz |

**İş Aşaması:**

| Aşama | Anlamı |
|---|---|
| Almış Müteahhit | İşin ana yüklenicisi belirlenmiş |
| Almış Taşeron | İşin taşeronu belirlenmiş |
| Müteahhit İhalesi | İşin yüklenicisi henüz belirlenecek |
| Taşeron İhalesi | İşin taşeronu henüz belirlenecek |
| Keşif | Teklif keşif amaçlı hazırlandı |
| Bayii | Teklif bayiye hazırlandı |
| OEM | Teklif OEM firmasına hazırlandı |

---

**Fırsat satırındaki teklif butonu — 3 farklı durum:**

| Buton | Renk | Ne anlama gelir | Tıklanınca |
|---|---|---|---|
| `📋 Teklif Oluştur` | Yeşil | Bu fırsat için henüz teklif yok | Format seçimi → Teklif Programı açılır |
| `✏️ Taslağı Aç` | Amber/Sarı | Teklif hazırlanmış ama henüz gönderilmemiş | Mevcut taslak doğrudan açılır |
| `🔗 Teklif Programı` | Mavi | Teklif gönderilmiş | Gönderilmiş teklif görüntülenir |

> 💡 Butonlara her tıklandığında CRM, teklif tutarını ve referansını Teklif Programı'ndan otomatik çekip fırsat kaydına yazar.

---

**Silinmiş teklif tespiti:**

Teklif Programı'nda silinmiş bir teklifin butonu varsa, tıklandığında sistem otomatik olarak:
1. Teklifin silindiğini tespit eder
2. CRM'deki referansı (quotationId, quotationUrl) temizler
3. Buton `📋 Teklif Oluştur`'a döner
4. Ekranda bildirim gösterir

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

> ℹ️ Teklif Programı üzerinden teklif oluşturulduğunda bu sekmede otomatik kayıt açılır.

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

| Araç | Ne yapar |
|---|---|
| **Aylık Rapor** (AI) | Groq AI ile son 30 günün yönetici raporu |
| **3 Aylık Rapor** (AI) | Groq AI ile çeyreklik analiz |
| **Geçmiş Raporlar** | Önceki AI raporlarını görüntüle |
| **İçe Aktar** | Excel/CSV ile toplu müşteri veya fırsat yükle |
| **Yedekleme** | Tüm veriyi JSON olarak indir veya geri yükle |
| **Yazdır** | Mevcut ekranı yazdır |

---

## BÖLÜM 2 — NextAura Teklif Programı

### 2.1 Giriş

**Önerilen yol:** CRM'den teklif butonuna basın — Teklif Programı yeni sekmede **otomatik giriş yapılmış şekilde** açılır.

**Doğrudan erişim:** NextAura tarafından firmanıza verilen Teklif Programı adresine gidin ve kullanıcı hesabınızla giriş yapın.

> 🔐 CRM'de kayıtlı her kullanıcı Teklif Programı'na da erişebilir. CRM'den silinen bir kullanıcının Teklif Programı erişimi de otomatik kaldırılır.

---

### 2.2 Teklif Ekranı — Renk Kodlu Bölümler

Teklif hazırlama ekranındaki her bölüm farklı renkle işaretlenmiştir. Bu sayede hangi bölümde çalıştığınızı hızlıca görebilirsiniz:

| Bölüm Başlığı Rengi | Bölüm Adı | İçerik |
|---|---|---|
| 🔵 Açık Mavi | **Malzeme / Kalemler** | A Bölümü, B Bölümü vb. — ürün kalemleri ve fiyatlar |
| 🟢 Koyu Yeşil | **Modüller** | Hazır modül paketleri |
| 🟣 İndigo | **Proje Bilgileri** | Referans, müşteri ilgilisi, satış temsilcisi, hazırlayan |
| 🟠 Amber | **Ticari Açıklamalar** | Ödeme, teslim süresi, garanti koşulları |

---

### 2.3 Proje Bilgileri Bölümü (İndigo Başlık)

Bu bölüm hem teklif çıktısını hem de CRM'i etkiler — mutlaka doldurun:

**Teklif Referansı**
- Dahili referans numarası veya kodu (ör: `REF-2024-001`, `tt-08-26-mat`)
- **Kaydedildiğinde CRM'deki fırsatın REF. sütununa otomatik yansır**
- Arama ve takip kolaylığı için kullanın

**Müşteri İlgilisi**
- Müşteri tarafındaki muhatap kişinin adı
- Teklif çıktısında (PDF/Excel) "İlgili" olarak görünür

**Satış Temsilcisi & Hazırlayan**
- Sorumlu isimleri girin
- Teklif kapak sayfasında ve çıktıda yer alır

> ⚠️ Bilgileri girdikten sonra `Kaydet` butonuna basmayı unutmayın.

---

### 2.4 Kalem Ekleme

**Malzeme bölümlerine (mavi başlık) kalem eklemek:**
1. `+ Kalem Ekle` butonuna tıklayın
2. Ürün seçin veya manuel girin (kod, açıklama, birim, miktar)
3. Fiyat otomatik hesaplanır; gerekirse override girin
4. Değişiklikler otomatik kaydedilir

**Yeni bölüm eklemek:**
1. Teklif altındaki `+ Yeni Bölüm Ekle`ye tıklayın
2. Bölüm kodu (A, B, C...) ve başlık girin

---

### 2.5 Teklif Yapısı

```
Teklif (Quotation)
  └── Revizyon (Revision)  ← fiyatlar burada
        └── Bölüm A: Malzeme (mavi)
        └── Bölüm B: İşçilik
        └── Modüller (yeşil)
        └── Proje Bilgileri (indigo)
        └── Ticari Açıklamalar (amber)
```

- Her teklif `DRAFT` (Taslak) olarak açılır
- Revizyon üzerinde çalışın, değişiklikler otomatik kaydedilir
- Gönderildiğinde statü `SENT` olarak güncellenir

---

### 2.6 Para Birimi & Fiyatlandırma

- Teklif para birimi: EUR (varsayılan) — TRY ve USD de seçilebilir
- TCMB döviz kurları otomatik çekilir
- Liste çarpanı, KDV oranı ve işçilik markup sistem ayarlarından gelir

---

### 2.7 Teklif Silme Koruması

| Statü | Silinebilir mi |
|---|---|
| Taslak (DRAFT) | ✅ Evet |
| Gönderildi | 🔒 Hayır |
| Revize | 🔒 Hayır |
| Randevu | 🔒 Hayır |
| Onaylandı | 🔒 Hayır |
| Reddedildi | 🔒 Hayır |

---

## BÖLÜM 3 — CRM & Teklif Programı Entegrasyonu

### 3.1 Standart İş Akışı (Tam Süreç)

```
ADIM 1 — Müşteri Ekle (CRM)
  └── 👥 Müşteriler → + Yeni Firma
      ├── Firma adı (zorunlu)
      ├── Telefon (önerilir — otomatik eşleşme için)
      └── E-posta (önerilir)

ADIM 2 — Fırsat Ekle (CRM)
  └── 🎯 Fırsatlar → + Yeni Fırsat
      ├── Başlık (proje/iş adı)
      ├── Müşteri seçin
      ├── Tahmini değer (€) girin
      └── Aşama: SICAK-1 veya SICAK-2

ADIM 3 — Teklif Oluştur (CRM → Teklif Programı)
  └── Fırsat satırı → [📋 Teklif Oluştur]
      ├── Teklif formatını seçin
      └── Teklif Programı otomatik açılır (SSO giriş)

ADIM 4 — Teklifi Hazırla (Teklif Programı)
  ├── 🔵 Malzeme bölümleri: kalemleri ekle, miktarları gir
  ├── 🟢 Modüller: modül paketlerini ekle (gerekirse)
  ├── 🟣 Proje Bilgileri:
  │     ├── Teklif Referansı gir → CRM REF. alanına yansır
  │     ├── Müşteri İlgilisi gir → Teklif çıktısında görünür
  │     ├── Satış Temsilcisi ve Hazırlayan gir
  │     └── [Kaydet] butonuna bas
  └── 🟠 Ticari Açıklamalar: ödeme ve teslim koşullarını düzenle

ADIM 5 — CRM'e Dön
  └── Fırsat satırında buton → [✏️ Taslağı Aç] (amber)
      = Teklif hazırlandı ama henüz gönderilmedi

ADIM 6 — Teklifi Gönder
  └── PDF/Excel indirin → müşteriye iletin
      ├── Teklif durumu DRAFT → SENT olur
      └── CRM'de buton → [🔗 Teklif Programı] (mavi) olur

ADIM 7 — Otomatik Senkronizasyon
  └── Butona her tıklandığında CRM güncellenir:
      ├── Teklif toplamı → Fırsat Değeri (€)
      ├── Teklif Referansı → Fırsat REF. alanı
      └── Teklif durumu → Buton rengi / etiketi

ADIM 8 — Sonucu Kaydet (CRM)
  ├── Onaylandı → Fırsat aşaması: KAZANILDI
  ├── Reddedildi → Aşama: KAÇTI veya NO GO
  └── Revizyon → Teklif Programı'nda yeni revizyon oluştur
```

---

### 3.2 Mevcut Teklifi Açma

Fırsata teklif zaten oluşturulmuşsa:

- **`✏️ Taslağı Aç`** (amber): Teklif taslak aşamasında, hâlâ düzenlenebilir
- **`🔗 Teklif Programı`** (mavi): Teklif gönderilmiş

Her iki durumda da tıklandığında otomatik giriş yapılır ve ilgili teklif açılır.

---

### 3.3 Mükerrer Teklif Koruması

Aynı fırsat için `📋 Teklif Oluştur` butonuna tekrar basılırsa sistem uyarır:

```
"Bu fırsat için zaten bir teklif oluşturulmuş: [başlık]
Mevcut teklifi açmak ister misiniz?

Tamam = Mevcut teklifi aç
İptal = Yine de yeni teklif oluştur"
```

Genellikle **Tamam** seçin — aynı fırsat için çift teklif oluşturmaktan kaçının.

---

### 3.4 Silinmiş Teklif Otomatik Temizliği

Teklif Programı'nda silinen bir teklif için CRM'deki butona tıklanırsa:

1. Sistem teklifi kontrol eder → silinmiş olduğunu tespit eder
2. CRM'deki referansları otomatik temizler
3. Buton `📋 Teklif Oluştur`'a döner
4. Ekranda uyarı bildirimi görünür

Herhangi bir manuel işlem yapmanıza gerek yoktur.

---

### 3.5 Müşteri Güncellemesi

CRM'de müşterinin telefon veya e-posta bilgisi güncellenip kaydedildiğinde, Teklif Programı'ndaki müşteri kaydı da otomatik güncellenir.

---

### 3.6 Kullanıcı Erişim Yönetimi (Admin)

| Durum | CRM | Teklif Programı |
|---|---|---|
| CRM'e yeni kullanıcı eklendi | ✅ Giriş yapabilir | ✅ Otomatik erişim açılır |
| CRM kullanıcısı silindi | ❌ Giriş yapamaz | ❌ Erişim otomatik kaldırılır |

> Teklif Programı için ayrı şifre yönetimi gerekmez — tüm erişim CRM üzerinden SSO ile sağlanır.

---

## BÖLÜM 4 — Sık Kullanılan İş Akışları

### Yeni müşteri → fırsat → teklif

```
1. Müşteriler → + Yeni Firma (telefon/e-posta girin)
2. Fırsatlar → + Yeni Fırsat (müşteri, değer, aşama)
3. Fırsat satırı → [📋 Teklif Oluştur] → Format seç
4. Teklif Programı'nda:
   - Malzeme kalemlerini girin (mavi bölüm)
   - Proje Bilgileri'ni doldurun (indigo bölüm) → Kaydet
5. CRM'de buton → [✏️ Taslağı Aç]
6. Teklifi müşteriye gönderin
7. CRM'de buton → [🔗 Teklif Programı]
8. Fırsat değeri ve REF. otomatik güncellenir
9. Onaylanınca → Fırsat aşaması: KAZANILDI
```

---

### Revizyon talebi

```
1. Teklif Programı'nda teklifi açın ([✏️ Taslağı Aç] veya [🔗 Teklif Programı])
2. Yeni revizyon oluşturun, değişiklikleri yapın
3. Teklifi tekrar gönderin
4. CRM → Teklif Talebi statüsünü "Revize" → "Gönderildi" olarak güncelleyin
```

---

### Gelen teklif talebi takibi

```
1. Müşteri teklif istedi
2. Fırsatlar → + Yeni Fırsat (aşama: TEKLİF)
3. Fırsat satırı → [📋 Teklif Oluştur]
4. Teklif hazırlandı → Proje Bilgileri'ni doldurun, Kaydet
5. Teklifi müşteriye gönderin
6. Teklif Talebi statüsünü → "Gönderildi" yapın
7. Müşteriden yanıt: → "Onaylandı" veya "Reddedildi"
```

---

## BÖLÜM 5 — Sık Sorulan Sorular

**S: Teklif Programı'na ayrı giriş yapmam gerekiyor mu?**  
C: Hayır. CRM'deki teklif butonlarına bastığınızda sistem sizi Teklif Programı'na otomatik olarak oturum açık şekilde yönlendirir.

**S: CRM'deki fırsat değeri ve REF. alanı nasıl güncelleniyor?**  
C: Fırsat satırındaki butona (✏️ Taslağı Aç veya 🔗 Teklif Programı) her tıkladığınızda sistem Teklif Programı'ndan güncel tutarı ve referansı çekip CRM'e yazar. Proje Bilgileri bölümünde Teklif Referansı girilip Kaydet'e basılması gerekir.

**S: Teklif Programı'nda müşteriyi bulamıyorum.**  
C: Müşteri, CRM'de telefon veya e-posta girilmeden kaydedilmiş olabilir. CRM'de müşteri kartını düzenleyip telefon/e-posta ekleyin. Sonraki teklif oluşturmada otomatik eşleşir.

**S: Aynı fırsat için yanlışlıkla 2 teklif oluşturdum.**  
C: Teklif Programı'nda DRAFT durumundaki fazla teklifi silin. Doğru teklif, fırsat satırındaki buton aracılığıyla açılan tekliftir.

**S: ✏️ Taslağı Aç ile 🔗 Teklif Programı arasındaki fark ne?**  
C: İkisi de aynı teklifi açar. Renk ve etiket, teklifin Teklif Programı'ndaki durumunu yansıtır: Amber (Taslağı Aç) = henüz gönderilmemiş, Mavi (Teklif Programı) = gönderilmiş.

**S: Teklif Programı'nda teklifi sildim, CRM'de hâlâ buton görünüyor.**  
C: Butona tıklayın — sistem silinen teklifi tespit eder, CRM'deki referansı temizler ve buton `📋 Teklif Oluştur`'a döner. Otomatik gerçekleşir.

**S: Teklif formatını sonradan değiştirebilir miyim?**  
C: Hayır. Format teklif oluşturulurken bir kez seçilir. Yanlış format seçildiyse DRAFT teklifte yeni bir teklif oluşturup eskisini silin.

**S: Teklifi silmeye çalışıyorum ama "korumalı" diyor.**  
C: Gönderildi, Revize, Randevu, Onaylandı veya Reddedildi statüsündeki teklifler silinemez. Sistem yöneticinize başvurun.

**S: CRM kullanıcısı silindikten sonra Teklif Programı'na girebilir mi?**  
C: Hayır. CRM'den silinen kullanıcının Teklif Programı erişimi otomatik olarak kaldırılır.

**S: Teklif Programı'nda EUR yerine TRY kullanabilir miyim?**  
C: Evet, teklif oluştururken para birimi seçilebilir. TCMB kuru üzerinden otomatik dönüşüm yapılır.

**S: Kendi firma logomu teklif çıktısına nasıl eklerim?**  
C: Yönetici yetkili kullanıcı → ⚙️ Ayarlar → Firma Bilgileri → Logo Yükle (PNG/JPEG, max 1.5 MB) → Kaydet. Ayrıntı için BÖLÜM 6.

**S: Çıktıda neden hiç logo görünmüyor?**  
C: Henüz logo yüklemediyseniz çıktıda logo basılmaz. Başka firmanın logosu asla görünmez. Logonuzu Ayarlar'dan yükleyin.

**S: "Hazırlayan" listesinde başka firmanın isimleri görünüyor.**  
C: Güncellendi. Liste artık yalnızca kendi firmanızın kullanıcılarını gösterir. Görünmeye devam ederse oturumu kapatıp tekrar girin.

---

## BÖLÜM 6 — Kiracı (Firma) Kurulumu: Logo, Marka ve Personel

> Bu bölüm, NextAura Teklif Programı'nı **kendi markanızla** kullanmanız için gereken kurulum adımlarını anlatır.

### 6.1 Çok Kiracılı Mantık

NextAura tek bir platformdur; her firma (kiracı) bu platformu kendi markasıyla, **birbirinden tamamen yalıtılmış** şekilde kullanır:

- Her kiracı yalnızca **kendi** müşterilerini, tekliflerini, ürünlerini ve personelini görür.
- Bir kiracının verisi başka kiracıya **asla** görünmez.
- Teklif çıktıları (PDF / Excel / ön izleme) her kiracının **kendi logosu ve firma bilgileriyle** üretilir.

### 6.2 Kiracı Yöneticisi (Ayarlar Erişimi)

Logo ve firma bilgilerini düzenlemek için **Yönetici** yetkisi gerekir:

1. Firmada bir kullanıcı Yönetici olarak atanır → sol menüde **⚙️ Ayarlar** görünür.
2. CRM üzerinden (SSO) giren kullanıcılar varsayılan olarak normal kullanıcıdır; yönetici yetkisi sistem tarafından bir kez tanımlanır. Yönetici yapıldıktan sonra CRM'den girişlerde de yetki korunur.

> ℹ️ Yönetici yetkisi tanımlandıktan sonra ilgili kullanıcı **mevcut oturumdan çıkıp tekrar girer**; "Ayarlar" menüsü o zaman görünür.

### 6.3 Logo ve Firma Bilgilerini Yükleme

1. Sol menü → **⚙️ Ayarlar**
2. **Firma Bilgileri** bölümünde doldurun:
   - Firma adı, adres, telefon, e-posta, web sitesi
3. **Logo Yükle** alanından firma logonuzu seçin:
   - Biçim: **PNG veya JPEG**
   - Boyut: **en fazla 1.5 MB**
   - "Logoyu kaldır" ile mevcut logoyu silebilirsiniz
4. **Kaydet**

### 6.4 Çıktıya Etkisi

| Alan | Çıktıda nerede görünür |
|---|---|
| Firma logosu | PDF / Excel / ön izleme **üst başlık** |
| Firma adı | Başlık ve **alt bilgi (footer)** |
| Adres / telefon / e-posta / web | Başlıktaki firma bilgi bloğu |

> ⚠️ **Logo yüklenmezse çıktıda hiç logo basılmaz** (boş bırakılır). Başka bir firmanın logosu asla görünmez. Logonuzu yükledikten sonra tüm yeni çıktılar otomatik olarak markanızla üretilir.

### 6.5 Personel Listesi (Satış Temsilcisi / Hazırlayan)

Proje Bilgileri bölümündeki **Satış Temsilcisi** ve **Hazırlayan** açılır listeleri yalnızca **kendi firmanızın** kullanıcılarını gösterir. Başka firmaların personeli bu listelerde görünmez.

---

*Teknik destek için sistem yöneticinize başvurun.*
