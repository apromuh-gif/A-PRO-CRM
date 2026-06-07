# A-PRO Mühendislik CRM — Proje Özeti
> Son güncelleme: 7 Haziran 2026 (v2.9 + Web Sitesi & Yedekleme)

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
- **Metin arama (Bul):** Firma adı + kişi adı araması

### Tedarikçiler
- 16 tedarikçi türü (Sigorta, Nakliye, Araç Tamir, Kırtasiye dahil)
- Kişi bazlı ✏️ düzenleme, 💬 WhatsApp
- Firma dropdown filtre
- **Metin arama (Bul):** Firma adı + kişi adı araması

### Fırsatlar
- Müteahhit sütunu
- Ön Gör. Sipariş Tarihi, Teklif Ref./Link
- Başlık + Satış Temsilcisi + Müşteri filtre
- **Fırsat Başlığı** sticky sütun: tam başlık tek satırda, ... olmadan okunabilir
- **Müşteri / Müteahhit** sütunları: çift satıra wrap (daha dar), diğer 10 sütun değişmedi
- `makeScrollTable` colWidths 12 sütuna güncellendi (hizalama düzeltildi)
- **Satış Temsilcisi dropdown:** yalnızca `hasTarget !== false` kullanıcıları listelenir
- **Metin arama (Bul):** Fırsat başlığı + müşteri firma adı araması

### Teklifler (Teklif Talepleri)
- Hazırlayan dropdown (sistem kullanıcıları)
- Dead Line / Link alanı
- Fırsat/Müşteri/Hazırlayan filtre
- **Hazırlayan dropdown:** yalnızca `hasTarget !== false` kullanıcıları listelenir
- **Metin arama (Bul):** Başlık + müşteri adı + hazırlayan araması
- **Gönderilme Tarihi** alanı — modalda + tabloda
- Durum → Gönderildi yapılınca sentDate otomatik dolar
- Mevcut Gönderildi teklifler modal açılınca sentDate otomatik tamamlanır
- **Otomatik gizleme:** Gönderildi + sentDate > 5 gün ise tablo görünümünden gizlenir (Firebase'den silinmez); badge ile sayı gösterilir + tıklanınca tüm gizli teklifler listelenir/düzenlenebilir

### Teknik Servis
- İşin Adı + Hazırlayan + Müşteri filtre
- Randevu tarihi takibi
- **Metin arama (Bul):** İş adı + müşteri adı + hazırlayan araması

### T.Servis İş Takip
- Ayrı `serviceOpps` koleksiyonu
- Başlık + Temsilci + Müşteri filtre
- **Metin arama (Bul):** Başlık + müşteri adı araması

### Periyodik Bakım Takip
- İşin Adı + Müşteri filtre
- Bakım tarihi takibi
- **Metin arama (Bul):** İş adı + müşteri adı araması

### Randevular
- Durum: Planlandı/Tamamlandı/İptal/Ertelendi
- Bugünkü randevular banner (mor)
- Firma + Temsilci + Durum filtre
- **Metin arama (Bul):** Müşteri adı + not + temsilci araması

### Ziyaretler
- Firma, Tarih+Saat, Temsilci, Proje, Not
- Not girilmedi uyarısı
- 4'lü filtre paneli
- **Metin arama (Bul):** Müşteri adı + proje + not araması

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

## 🏪 NextAura Ticari Ürün

**Marka:** NextAura — Mühendislik & Teknik Hizmetler için B2B SaaS CRM + Teklif Platformu  
**Web Sitesi:** `/TİCARİ CRM & TEKLİF/NextAura_Website.html`

### Fiyatlandırma (Onaylı)
| | Başlangıç (≤3 kişi) | Profesyonel (3-8 kişi) | Kurumsal (9+ kişi) |
|---|---|---|---|
| **CRM** | ₺2.900/ay | ₺5.900/ay | ₺10.900/ay |
| **Teklif** | ₺2.500/ay | ₺4.900/ay | ₺9.500/ay |
| **Suite** | ₺4.900/ay | ₺8.900/ay | ₺16.900/ay |
| **Yıllık (−%20)** | ↑ × 0.80 | ↑ × 0.80 | ↑ × 0.80 |
| **Kurulum** | Ücretsiz | ₺3.500 | ₺5.000 |
| **Yıllık Bakım** | ₺6.000/yıl | ₺9.500/yıl | ₺15.000/yıl |

EUR karşılıkları (1 EUR = 53 TRY): CRM €55/€110/€205 · Teklif €47/€90/€179 · Suite €90/€165/€315

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
- [ ] **NextAura web sitesi** KVKK sayfası

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

## 🌐 NextAura Web Sitesi (TİCARİ CRM & TEKLİF)

**Dosya:** `/TİCARİ CRM & TEKLİF/NextAura_Website.html`  
**Marka:** NextAura — Mühendislik & Teknik Hizmetler için B2B SaaS CRM + Teklif Platformu  
**Son güncelleme:** 7 Haziran 2026

### Tamamlananlar

| Bölüm | Durum | Açıklama |
|---|---|---|
| **Tasarım Sistemi** | ✅ | Koyu lacivert-amber renk paleti, Outfit font, animasyonlu navbar |
| **Logo** | ✅ | `NextAura_Logo.png` — göreli yol (file:// uyumlu), tam ekran slayt (object-fit:cover) |
| **Hero** | ✅ | Sol hizalı split-screen, 4 slayt (logo/CRM pipeline/Teklif hızı/YZ raporlar), pause-on-hover |
| **Hero Slayt Zemini** | ✅ | Slayt 2-3-4 zemin rengi sektör carousel ile uyumlu (#1e1b4b→#312E81 gradyan) |
| **Sektör Carousel** | ✅ | EPC / İnşaat / MEP Taahhüt / Sistem Entegratörleri — 4sn otomatik, pause-on-hover |
| **Badge** | ✅ | "EPC, İNŞAAT, TAAHHÜT VE PROJE FİRMALARINA ÖZEL" |
| **Stats Bar** | ✅ | Teknik·Taahhüt odaklı / 5×+ hızlı teklif / 99.9% erişilebilirlik / Sınırsız teklif hacmi |
| **Rakip Karşılaştırma** | ✅ | 8 sütun + "Kullanım Kolaylığı" bölümü |
| **Fiyatlandırma** | ✅ | 3 ürün sekmesi (CRM / Teklif / Suite), aylık/yıllık toggle (%20 indirim) |
| **Kurulum & Yıllık Bakım** | ✅ | kurulum (ücretsiz/₺3.500/₺5.000) + yıllık bakım (₺6.000/₺9.500/₺15.000/yıl) |
| **İletişim Formu** | ✅ | Sektörel demo talep, demo ve yanıt süresi bilgileri |
| **TR/EN Çoklu Dil** | ✅ | data-tr/data-en attribute sistemi |
| **Mobil Uyum** | ✅ | Responsive navbar, hamburger menü, tek kolon mobil layout |
| **Silinen Bölüm** | ✅ | "Standart CRM'lerin Göremediği Sorunlar" kaldırıldı |

### Onaylanan Fiyat Listesi

| | Başlangıç (≤3 kişi) | Profesyonel (3-8 kişi) | Kurumsal (9+ kişi) |
|---|---|---|---|
| **CRM** | ₺2.900/ay | ₺5.900/ay | ₺10.900/ay |
| **Teklif** | ₺2.500/ay | ₺4.900/ay | ₺9.500/ay |
| **Suite** | ₺4.900/ay | ₺8.900/ay | ₺16.900/ay |
| **Yıllık (−%20)** | ↑ × 0.80 | ↑ × 0.80 | ↑ × 0.80 |
| **Kurulum** | Ücretsiz | ₺3.500 | ₺5.000 |
| **Yıllık Bakım** | ₺6.000/yıl | ₺9.500/yıl | ₺15.000/yıl |

> Yıllık bakım abonelik indiriminden etkilenmez, sabit fiyattır.

### Hedef Sektörler
EPC & Anahtar Teslim Projeler · İnşaat & Taahhüt · Yangın & Güvenlik Sistemleri · Bina Otomasyonu & BMS · Sistem Entegratörleri · Mekanik & Elektrik Taahhüt

### Yapılacaklar (Pending)
- [ ] Fiyat kartı görsel hatasını düzelt (sekme geçişinde fiyat render sorunu)
- [ ] İngilizce teklif özelliği Teklif Programı'na ekle
- [ ] Sektörel demo yönlendirmesi (iletişim formunda gizli alan)
- [ ] Slayt 1 EPC metninde "Tedarikçi teklifleri CRM'e eklenir" satırını güncelle

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
| Haziran 2026 | v2.7 | Teklif Programı tam entegrasyonu, yedekleme sistemi, teklif koruması |
| 5–7 Haz 2026 | v2.8 | Rol bazlı erişim kontrolü, SSO admin koruması, para birimi seçimi, personel senkronizasyonu, login tasarımı, silme koruması revizyonu |
| 7 Haz 2026 | v2.9 | Sticky navbar + tablo başlıkları, hedefsiz kullanıcı dropdown filtrelemesi, 9 bölümde Bul arama kutusu, Bul donma + pozisyon + TypeError düzeltmeleri |
| 7 Haz 2026 | Web | Firebase Firestore günlük yedekleme (GitHub Actions, private repo, 30 gün rolling) |
| 7 Haz 2026 | Web | NextAura web sitesi: badge güncelleme, hero logo tam ekran, sektör carousel (EPC/İnşaat/MEP/SiEnt), stats bar, pause-on-hover, "Sorunlar" bölümü kaldırıldı, slayt zemin renk uyumu |

---

## 🔗 Teklif Programı Entegrasyonu (v2.7)

### Yapılanlar
| Özellik | Açıklama |
|---|---|
| **Tab adı** | "Teklifler" → "Teklif Talepleri" (gelen talep takibi) |
| **Format seçimi** | Teklif oluştururken: Sistem Satış / Birim Fiyatlı / Sistem Master seçim ekranı |
| **quotationId bağlantısı** | Oluşturulan teklif ID'si hem `proposals` hem `opportunities` koleksiyonuna yazılıyor |
| **Mükerrer önleme** | Aynı fırsata ikinci teklif oluşturulmaya çalışılınca uyarı + onay dialog'u |
| **Bağlantı görünümü** | Fırsatta 🔗 linki yalnızca teklif "Gönderildi" statüsüne geçince görünür (taslakta görünmez) |
| **Teklif Oluştur konumu** | Yalnızca fırsat satırlarından erişilebilir; ana bar ve müşteri kartından kaldırıldı |
| **Müşteri senkronizasyonu** | Müşteri düzenlenince Teklif Programı'na PATCH isteği gönderilir (fire-and-forget) |
| **Teklif Programı linki** | Teklif Talepleri tablosunda `quotationUrl` varsa 🔗 Teklif Programı butonu çıkar |
| **❓ Yardım** | Info bar'a Kullanım Kılavuzu linki eklendi |

### API Endpoint'leri (A-PRO Teklif Programı)
| Endpoint | Açıklama |
|---|---|
| `POST /api/v1/crm/open-quotation` | Teklif oluştur (format + quotationId response eklendi) |
| `PATCH /api/v1/crm/customers` | Müşteri güncelle (yeni endpoint) |

---

## 🛡️ Teklif Silme Koruması (v2.8 — Revize Edildi)

| Durum | Davranış |
|---|---|
| `quotationId` **yok** (yalnızca CRM talebi) | Onay dialog'u çıkar, onaylanırsa silinir |
| `quotationId` **var** (Teklif Programı'nda hazırlandı) | 🔒 Korumalı — silinemez, buton kilitlenir |

> **Önceki (v2.7):** statüs bazlı koruma. **Yeni (v2.8):** yalnızca Teklif Programı bağlantılı teklifler korumalı.

---

## 🔗 Teklif Programı — v2.8 Güncellemeleri (5–7 Haziran 2026)

### Rol Bazlı Erişim Kontrolü
- `SALES_USER` rolündeki kullanıcılar "Yeni Teklif Talebi" butonunu göremez (Dashboard + Teklif Talepleri)
- Sunucu tarafında da zorlama: `SALES_USER` → `POST /api/v1/quotations` → `403`

### SSO Admin Rolü Koruması
- CRM üzerinden giriş yapan `ADMIN` kullanıcıların rolü artık `SALES_USER`'a düşürülmüyor
- `crm/auth/route.ts`: mevcut kullanıcının rolü korunur; yeni kullanıcılar `SALES_USER` ile oluşturulur

### Para Birimi Seçimi
- Teklif oluşturma akışına EUR / USD / TRY seçim adımı eklendi
- Format **ve** para birimi seçilmeden "Teklif Oluştur →" butonu aktif olmaz

### Personel Senkronizasyonu (Satış Temsilcisi / Hazırlayan)
| Bileşen | Açıklama |
|---|---|
| **CRM → Teklif Programı** | Teklif açma/oluşturmada `POST /api/v1/crm/staff-lists` ile `hasTarget` filtreli liste gönderilir |
| **Teklif Programı DB** | `SystemSettings.crmSalesReps` + `crmPreparedByNames` (Prisma migration eklendi) |
| **QuotationInfoPanel** | `salesRep` ve `preparedBy` alanları CRM listesinden doldurulur (ayrı diziler) |
| **Geri senkronizasyon** | Seçilen `salesRep` → CRM fırsatının `assignedTo` alanına yazılır |
| **Hedefsiz kullanıcı filtresi** | `hasTarget` false/tanımsız olanlar tüm listelerde gösterilmez |

### Silinen Teklif Temizleme
- `exists: false` → CRM fırsatındaki `value`, `tenderRef`, `assignedTo` sıfırlanır
- `exists: true` → `salesRep` → `assignedTo` otomatik güncellenir

### Giriş Ekranı Yeniden Tasarımı
- Sol panel: `#C41E3A` kırmızı, logo + "Teklif Yönetim Platformu" başlığı
- Sağ panel: beyaz form kartı, `#C41E3A` odak rengi ve buton; mobilde sol panel gizlenir

### API Endpoint'leri (v2.8 Eklenenler)
| Endpoint | Açıklama |
|---|---|
| `POST /api/v1/crm/staff-lists` | CRM'den personel listesi senkronizasyonu (CRM key auth) |
| `GET /api/v1/staff` | `{salesReps[], preparedByNames[]}` döner |

---

## 💾 Otomatik Yedekleme Sistemi

### Teklif Programı (PostgreSQL) — v2.7
**GitHub Actions** — her gece 02:00 TR otomatik.

| Yedek | Format | Konum |
|---|---|---|
| Neon PostgreSQL | `.sql.gz` | `apro-platform` → `db-backups` branch |

### Firebase Firestore (CRM) — 7 Haziran 2026
**Repo:** `apromuh-gif/a-pro-crm-backup` (private)  
**Çalışma zamanı:** Her gece 04:00 TR (01:00 UTC)  
**Secret:** `FIREBASE_SERVICE_ACCOUNT` (GitHub repository secret)

| Koleksiyon | Yedek formatı | Saklama |
|---|---|---|
| 11 Firestore koleksiyonu | `backups/YYYY-MM-DD/*.json` | 30 gün rolling |

- `backup.js` → firebase-admin SDK ile Firestore okur, JSON'a yazar
- 30 günden eski klasörler otomatik silinir
- İlk başarılı çalışma: 7 Haziran 2026 ✅

---

## 📚 Kullanım Kılavuzu

| Dosya | Açıklama |
|---|---|
| `KULLANIM_KILAVUZU.html` | Tam stillenmiş HTML kılavuz (11 bölüm, sidebar navigasyon) |
| `KULLANIM_KILAVUZU.md` | Markdown versiyonu |
