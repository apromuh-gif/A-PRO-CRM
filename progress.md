# A-PRO Mühendislik CRM — Proje Özeti
> Son güncelleme: Haziran 2026

---

## 🔗 Bağlantılar

| | |
|---|---|
| **Canlı Site** | https://apromuh-gif.github.io/A-PRO-CRM |
| **GitHub Repo** | apromuh-gif/A-PRO-CRM (Public) |
| **Firebase Proje** | a-pro-crm |
| **Çalışma Dosyası** | `/home/claude/APRO_CRM_clean.html` (326KB) |
| **Versiyon** | v2.5+ |

---

## 🏗️ Teknik Mimari

- **Tek dosya HTML** — Firebase + Vanilla JS, framework yok
- **Virtual DOM** — `h()` fonksiyonu ile React benzeri render
- **Firebase Firestore** — gerçek zamanlı senkronizasyon
- **GitHub Pages** — ücretsiz hosting
- **PWA** — iOS/Android ana ekrana eklenebilir

### Bağımlılıklar (CDN)
| Kütüphane | Amaç |
|---|---|
| Firebase 10.7.1 | Veritabanı |
| EmailJS v4 | Mail bildirimleri |
| SheetJS 0.20.1 | Excel import |
| DM Sans / Inter | Font |

---

## 📱 Firebase Koleksiyonları

| Koleksiyon | İçerik |
|---|---|
| `customers` | Müşteri firmaları ve kişiler |
| `suppliers` | Tedarikçi firmaları ve kişiler |
| `opportunities` | Satış fırsatları |
| `proposals` | Teklifler |
| `services` | Teknik servis kayıtları |
| `serviceOpps` | T.Servis iş takip |
| `maintenances` | Periyodik bakım takip |
| `visits` | Saha ziyaretleri |
| `appointments` | Randevular |
| `users` | Kullanıcılar (şifre, rol, hedef) |
| `settings/config` | Groq API key |
| `settings/targets` | Yıllık hedefler |

---

## ✅ Tamamlanan Modüller

### Temel Altyapı
- Firebase Firestore backend, realtime sync
- Giriş sistemi (şifre tabanlı, kullanıcı rolleri)
- Loading spinner, toast bildirimleri
- Overlay/modal sistemi (bottom sheet mobil)
- JSON/CSV yedekleme & geri yükleme
- Excel/CSV import (SheetJS, mükerrer kontrol)
- Araçlar ▾ dropdown menü (Aylık Rapor, 3 Aylık, Geçmiş, İçe Aktar, Yedekleme, Yazdır, Test)

### Kullanıcı Yönetimi
- Admin / Kullanıcı rol ayrımı
- `hasTarget` — hedefsiz kullanıcılar dashboard'dan çıkar
- `isAdmin` — yönetici yetkileri
- Şifre değiştirme paneli

### Müşteriler
- 15 sektör kategorisi (SEC_C)
- Firma kartı + kişi yönetimi
- Kişi bazlı ✏️ düzenleme, 💬 WhatsApp
- Alfabetik sıralama, firma dropdown filtre

### Tedarikçiler
- 16 tedarikçi türü (Sigorta, Nakliye, Araç Tamir, Kırtasiye dahil)
- Kişi bazlı ✏️ düzenleme, 💬 WhatsApp
- Firma dropdown filtre

### Fırsatlar
- Müteahhit sütunu
- Ön Gör. Sipariş Tarihi, Teklif Ref./Link
- Başlık + Satış Temsilcisi + Müşteri filtre
- **Fırsat Başlığı** sticky sütun: tam başlık tek satırda, ... olmadan okunabilir
- **Müşteri / Müteahhit** sütunları: çift satıra wrap (daha dar), diğer 10 sütun değişmedi
- `makeScrollTable` colWidths 12 sütuna güncellendi (hizalama düzeltildi)

### Teklifler
- Hazırlayan dropdown (sistem kullanıcıları)
- Dead Line / Link alanı
- Fırsat/Müşteri/Hazırlayan filtre
- **Gönderilme Tarihi** alanı — modalda + tabloda
- Durum → Gönderildi yapılınca sentDate otomatik dolar
- Mevcut Gönderildi teklifler modal açılınca sentDate otomatik tamamlanır
- **Otomatik gizleme:** Gönderildi + sentDate > 5 gün ise tablo görünümünden gizlenir (Firebase'den silinmez); badge ile sayı gösterilir + tıklanınca tüm gizli teklifler listelenir/düzenlenebilir

### Teknik Servis
- İşin Adı + Hazırlayan + Müşteri filtre
- Randevu tarihi takibi

### T.Servis İş Takip
- Ayrı `serviceOpps` koleksiyonu
- Başlık + Temsilci + Müşteri filtre

### Periyodik Bakım Takip
- İşin Adı + Müşteri filtre
- Bakım tarihi takibi

### Randevular
- Durum: Planlandı/Tamamlandı/İptal/Ertelendi
- Bugünkü randevular banner (mor)
- Firma + Temsilci + Durum filtre

### Ziyaretler
- Firma, Tarih+Saat, Temsilci, Proje, Not
- Not girilmedi uyarısı
- 4'lü filtre paneli

### Dashboardlar
- **Yönetici:** KPI kartları, pipeline, win rate, T.Servis hedef
- **Satış/Proje:** Temsilci performans, Hit Rate, Teklif Performans
- **Pazarlama:** Aylık müşteri kazanımı
- Tarih aralığı filtresi (3 dashboard)
- **Teklif Performansı:** Gönderildi statüsü ayrı olarak izlenir (Bekleyen'den ayrıldı)
- **Süresi Geçen Teklifler:** Son 10 gün / Bu Ay filtresi → `validUntil` bazlı (createdAt hatası düzeltildi)
- Kişi bazlı süresi geçen teklif sayısı — filtre aktifken 0 olarak görünür
- Tüm hazırlayanlar filtrede görünür (eski hata: yalnızca 1 kişi geliyordu)

### AI Raporlar
- **Groq API** — `llama-3.3-70b-versatile`
- Aylık rapor (10 bölüm, 8000 token)
- 3 Aylık rapor (12 bölüm, 8000 token)
- Geçmiş raporlar arşivi

---

## 🔔 Bildirim Sistemi

### Sesli Bildirimler
- 5 ses tonu: urgent/warning/info/win/lose
- Her 60 saniyede `checkAllNotifications()`
- Mac uyumlu AudioContext (resume)
- `window._notifiedKeys` — aynı oturumda tekrar etmez

| Modül | Tetikleyici | Zaman | Kime |
|---|---|---|---|
| Randevular | Yarın randevu | 16:30 | Temsilci + Admin |
| Randevular | Bugün randevu | 90dk önce | Temsilci + Admin |
| Ziyaretler | Yarın ziyaret | 16:30 | Temsilci |
| Ziyaretler | Bugün ziyaret | 90dk önce | Temsilci |
| Ziyaretler | Not girilmedi | +1 gün 14:00 | Temsilci |
| Fırsatlar | Sipariş tarihi 7 gün | 09:00 | Temsilci |
| Fırsatlar | 10+ gün güncellenmemiş | Pazartesi 09:00 | Temsilci + Admin |
| Fırsatlar | KAZANILDI | Anında | Admin |
| Fırsatlar | Kaybedildi | Anında | Admin |
| Teklifler | Dead line 1 gün | 08:00 | Hazırlayan |
| Teklifler | Süresi geçti | Her gün 09:00 | Hazırlayan + Admin |
| T.Servis | Randevu 1 gün önce | 16:30 | Hazırlayan |
| T.Servis | Dead line 1 gün | 08:00 | Hazırlayan |
| Bakım | 7 gün kaldı | 09:00 | Sorumlu |
| Bakım | Tarihi geçti | Her gün 09:00 | Sorumlu + Admin |

### Mail Bildirimleri (EmailJS)
- **Service:** `service_xm7vpad`
- **Template:** `template_tfhbxqv`
- **Public Key:** `aFlqv_CSdq9QliGtN`
- Her 5 dakikada `checkAllMails()`
- Template: `{{{body}}}` HTML render, `{{to_email}}` alıcı

| Tetikleyici | Zaman | Kime |
|---|---|---|
| Yarın randevu | 16:30 | Temsilci |
| Yarın ziyaret | 16:30 | Temsilci |
| Sipariş tarihi 1 gün | 08:00 | Temsilci |
| Servis randevusu 2 gün | 16:30 | Sorumlu |
| Bakım tarihi 7 gün | 09:00 | Sorumlu |

---

## 📱 Mobil Uyum

### PWA
- iOS: Safari → Paylaş → Ana Ekrana Ekle (banner çıkar)
- Android: Chrome kurulum dialogu (`beforeinstallprompt`)
- Giriş sonrası 3sn gecikmeli banner
- `apple-mobile-web-app-capable` meta tagları eklendi

### Responsive Tasarım
- `window.innerWidth <= 768` kontrolü (JS inline)
- `orientationchange` + `resize` → otomatik render
- Modal → bottom sheet (≤768px)
- Tab bar → yatay kaydırma
- Servis tab'ları → 🔧 Servis ▾ dropdown
- Araçlar menüsü → mobilde Hedefler+Kullanıcılar dahil

| Modül | Masaüstü | Mobil |
|---|---|---|
| Müşteriler | 2 sütun grid | 1 sütun |
| Tedarikçiler | 2 sütun grid | 1 sütun |
| Fırsatlar | Tablo | Kart |
| Teklifler | Tablo | Kart |
| T.Servis | Tablo | Kart |
| Teknik Servis | Tablo | Kart |
| Periyodik Bakım | Tablo | Kart |
| Dashboard butonları | Yan yana | flex:1 tam genişlik |
| Tarih filtreleri | Yan yana | Responsive wrap |

---

## 🔐 Güvenlik Durumu

| Konu | Durum |
|---|---|
| GitHub repo | ✅ Public (Pages için gerekli) |
| DEFAULT_USERS şifreleri | ✅ Temizlendi (sadece admin var) |
| Firebase Security Rules | ⚠️ Güncellemeli |
| Şifre hashing | ❌ Yapılmadı (PENDING) |
| Erişim logu | ❌ Yapılmadı (PENDING) |
| KVKK / VERBİS | ❌ Yapılmadı (PENDING) |

---

## 🏪 Nexora Ticari Ürün

**Marka:** Nexora Business Intelligence CRM  
**Logo:** Hex Prism (01) — mor/indigo, N harfi altıgen

### Dosyalar
| Dosya | Açıklama |
|---|---|
| `Nexora_Website_updated.html` | Web sitesi (Hex Prism logo eklendi) |
| `Nexora_Fiyat.html` | Fiyat listesi sayfası (web sitesiyle uyumlu) |
| `Nexora_Fiyat_Listesi.html` | Bağımsız fiyat listesi |

### Fiyatlandırma
| Paket | Kullanıcı | Aylık | Yıllık |
|---|---|---|---|
| Başlangıç | 1-3 | ₺1.200 | ₺1.020 |
| Profesyonel | 4-10 | ₺2.400 | ₺2.040 |
| Kurumsal | 10+ | ₺4.500 | ₺3.825 |

| Hizmet | Ücret |
|---|---|
| Standart Kurulum | ₺5.000 |
| Kurumsal Kurulum | ₺15.000 |
| Yıllık Bakım Temel | ₺4.800/yıl |
| Yıllık Bakım Standart | ₺9.600/yıl |
| Yıllık Bakım Premium | ₺24.000/yıl |
| Ek Geliştirme | ₺1.200/saat |

---

## 📋 PENDING — Yapılacaklar

### Yüksek Öncelik
- [ ] **Firebase Security Rules** güncellenmeli
- [ ] **Şifre hashing** (SHA-256, mevcut kullanıcılar otomatik migrate)
- [ ] **Erişim logu** (kim/ne zaman/ne yaptı)
- [ ] **KVKK** — VERBİS kaydı, Aydınlatma Metni, DPA şablonu

### Orta Öncelik
- [ ] **Oturum zaman aşımı** (X dakika işlem yapılmazsa çıkış)
- [ ] **WhatsApp Business entegrasyonu**
- [ ] **Mobil ince ayarlar** (test & feedback bazlı)
- [ ] **Nexora web sitesi** KVKK sayfası

### Uzun Vadeli
- [ ] **Multi-tenant mimari** (her müşteri ayrı Firebase)
- [ ] **Firebase Authentication** (mevcut şifre sistemi yerine)
- [ ] **Muhasebe entegrasyonu** (Logo, Netsis, Paraşüt)
- [ ] **Beyaz etiket** (müşteri logosu)

---

## 🧪 Test Protokolü

```bash
node << 'EOF'
const fs=require('fs');
const html=fs.readFileSync('/home/claude/APRO_CRM_clean.html','utf8');
const allScripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const mainScript=allScripts.filter(s=>s[1].length>1000).pop();
const vm=require('vm');
try{new vm.Script(mainScript[1]);console.log('✅ JS SYNTAX OK');}
catch(e){console.log('❌',e.message);}
const after=html.slice(html.lastIndexOf('</html>')+7).trim();
console.log(after.length===0?'✅ HTML sonu temiz':'❌ HTML sonrası var');
EOF
```

---

## 🕐 Geliştirme Geçmişi

| Tarih | Versiyon | Önemli Değişiklikler |
|---|---|---|
| Mayıs 2026 başı | v2.0 | Temel CRM, Firebase bağlantısı |
| Mayıs 2026 | v2.3 | Sesli bildirim sistemi |
| Mayıs 2026 | v2.4 | Mail bildirimleri (EmailJS) |
| Mayıs 2026 | v2.5 | Excel import, mobil uyum başlangıç |
| Mayıs 2026 | v2.5+ | PWA, tam mobil uyum, Araçlar menüsü |
| Haziran 2026 | v2.6 | Teklifler: sentDate alanı, otomatik gizleme (>5 gün), gizli teklif badge |
| Haziran 2026 | v2.6 | Teklif Performansı: Gönderildi ayrımı, validUntil bazlı tarih filtresi, çoklu hazırlayan fix |
| Haziran 2026 | v2.6 | Fırsatlar: sticky başlık tam okunur, Müşteri/Müteahhit wrap, 12 sütun hizalama düzeltildi |
| Haziran 2026 | v2.6 | makeScrollTable: yatay ok navigasyon, double-rAF kolon genişlik senkronizasyonu |
