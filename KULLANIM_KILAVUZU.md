# A-PRO Mühendislik — CRM & Teklif Programı Kullanım Kılavuzu

> **Sistemler:** A-PRO CRM (Nexora) · A-PRO Teklif Programı  
> **Güncellenme:** Haziran 2026

---

## Hangi Sistem Ne İçin?

| A-PRO CRM (Nexora) | A-PRO Teklif Programı |
|---|---|
| Müşteri ilişkileri takibi | Detaylı mühendislik teklifi hazırlama |
| Satış fırsatı yönetimi | Kalem kalem fiyatlandırma |
| Teklif talep takibi | Revizyon ve onay süreci |
| Randevu & ziyaret kaydı | PDF çıktı ve arşiv |
| Servis & bakım takibi | Teklif numaralandırma |
| **Giriş:** apromuh-gif.github.io/A-PRO-CRM | **Giriş:** apro-platform.vercel.app |

**Temel kural:** Müşteri ilişkisini CRM'den yönetin, teklifin içeriğini Teklif Programı'ndan hazırlayın. İki sistem birbirine bağlıdır.

---

## BÖLÜM 1 — A-PRO CRM (Nexora)

### 1.1 Giriş

1. `apromuh-gif.github.io/A-PRO-CRM` adresine gidin
2. Kullanıcı adı ve şifrenizle giriş yapın
3. Ana ekranda üst sekme çubuğu görünür

---

### 1.2 Dashboard

Açılış ekranı. Tek bakışta özet bilgi:

- **Pipeline Değeri** — Aktif fırsatların toplam tutarı
- **Bu Ay Hedef** — Yıllık hedefin aylık dağılımı
- **Fırsat Dağılımı** — Kazanıldı / Devam Eden / Kaybedilen pasta grafik
- **Yaklaşan Randevular** — Bugün ve bu haftaki randevular
- **Son Ziyaretler** — En son kayıt edilen saha ziyaretleri
- **Bildirimler** (sağ üst zil) — Size atanan görevler ve güncellemeler

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
- `📋 Teklif Oluştur` — müşteri için bağımsız teklif başlatır
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
| SICAK-1 | İlk temas, ilgi var |
| SICAK-2 | Görüşmeler ilerledi |
| TEKLİF | Teklif hazırlanıyor veya gönderildi |
| ERTELENDİ | Geçici duraksama |
| KAZANILDI | Sözleşme imzalandı |
| KAÇTI | Rakibe gitti |
| NO GO | Müşteri vazgeçti |
| FIRSAT ÖLDÜ | İptal / geçersiz |

**Fırsat satırındaki butonlar:**

- `💬` — Müşteriye WhatsApp
- `📋 Teklif Oluştur` — Bu fırsat için Teklif Programı'nda teklif açar *(teklif henüz oluşturulmamışsa görünür)*
- `🔗 Teklif Programı` — Oluşturulmuş teklifi açar *(teklif varsa görünür)*
- `Düzenle` — Fırsat bilgilerini güncelle
- `Sil` — Fırsatı sil

---

### 1.5 Teklif Talepleri

CRM'deki teklifler, müşteriden gelen **teklif taleplerinin takibidir** — teklifin kalemleri burada değil, Teklif Programı'nda hazırlanır.

**Ne zaman kullanılır:**
- Müşteri telefon veya e-posta ile teklif istedi → kayda alın
- Teklif hazırlanıyor mu, gönderildi mi, onaylandı mı → statüyü güncelleyin

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

---

### 1.8 Servis & Bakım

- **Servis:** Tek seferlik teknik servis işleri (arıza giderme, kurulum, vs.)
- **Bakım:** Periyodik bakım sözleşmeleri

Her iki modülde de müşteri, sorumlu kişi, tutar ve tamamlanma durumu takip edilir.

---

## BÖLÜM 2 — A-PRO Teklif Programı

### 2.1 Giriş

1. `apro-platform.vercel.app` adresine gidin
2. Kullanıcı hesabınızla giriş yapın

---

### 2.2 Teklif Oluşturma

**CRM üzerinden (önerilen yol):**
1. CRM'de fırsatı bulun
2. `📋 Teklif Oluştur` butonuna tıklayın
3. Teklif Programı otomatik açılır — müşteri zaten kayıtlı, proje adı fırsat başlığından gelir
4. Kalemleri ekleyin, fiyatları girin

**Doğrudan Teklif Programı'ndan:**
1. Sol menüden `Teklifler` → `+ Yeni Teklif`
2. Müşteriyi seçin veya oluşturun
3. Proje adı ve para birimini girin

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

- Teklif para birimi: EUR (varsayılan)
- TCMB döviz kurları otomatik çekilir
- Liste çarpanı, KDV oranı ve işçilik markup sistem ayarlarından gelir, revizyon bazında değiştirilebilir

---

## BÖLÜM 3 — Entegrasyon: CRM'den Teklif Oluşturma

### 3.1 Fırsattan Teklif Oluşturma (Standart Akış)

```
1. CRM → Fırsatlar sekmesi
2. İlgili fırsatı bulun
3. Satır sonundaki [📋 Teklif Oluştur] butonuna tıklayın
4. Teklif Programı yeni sekmede açılır
   - Müşteri otomatik eşleştirilir (telefon/e-posta ile)
   - Proje adı fırsat başlığından gelir
   - DRAFT teklif hazır
5. Teklif kalemleri ve fiyatlar girilir
6. CRM'e dönün:
   - Fırsat satırında [🔗 Teklif Programı] linki görünür
   - Teklif Talepleri sekmesinde kayıt otomatik açılmıştır
```

---

### 3.2 Müşteri Kartından Teklif Oluşturma

Belirli bir fırsata bağlı olmayan, genel bir teklif için:

```
1. CRM → Müşteriler sekmesi
2. Müşteri kartındaki [📋 Teklif Oluştur] butonuna tıklayın
3. Teklif Programı açılır, müşteri kaydı eşleştirilir
4. Proje adını Teklif Programı'nda kendiniz yazın
```

---

### 3.3 Mevcut Teklifi Açma

Fırsata teklif zaten oluşturulmuşsa:
- Fırsat satırında `📋 Teklif Oluştur` yerine `🔗 Teklif Programı` linki görünür
- Tıklayarak doğrudan ilgili teklifi açın

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

## BÖLÜM 4 — Sık Kullanılan İş Akışları

### Yeni müşteri → fırsat → teklif

```
1. Müşteriler → + Yeni Firma (telefon ve e-posta girin)
2. Fırsatlar → + Yeni Fırsat (müşteriyi seçin, aşama: SICAK-1)
3. Fırsat satırı → 📋 Teklif Oluştur
4. Teklif Programı'nda kalemleri girin
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
3. Teklif hazırlandığında fırsattan Teklif Oluştur'a bas
4. Teklif Talebi kaydı otomatik güncellenir (🔗 link eklenir)
5. Statüyü → Gönderildi olarak güncelleyin + gönderim tarihini girin
6. Müşteriden yanıt gelince → Onaylandı veya Reddedildi
```

---

### Revizyon talebi

```
1. Teklif Talepleri → ilgili kaydı Düzenle → Statü: Revize
2. Teklif Programı'nda 🔗 bağlantısıyla teklifi açın
3. Yeni revizyon oluşturun, değişiklikleri yapın
4. Teklifi tekrar gönderin → Statü: Gönderildi
```

---

## BÖLÜM 5 — Sık Sorulan Sorular

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

---

*Teknik destek için sistem yöneticinize başvurun.*
