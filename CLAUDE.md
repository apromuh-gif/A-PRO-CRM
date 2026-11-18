# A-PRO Mühendislik CRM — Claude Code Talimatları

## Proje Özeti
- **Ana dosya:** `index.html` (tek dosya uygulama, ~900KB) — CANLI ve tek gerçek kaynak. `APRO_CRM_Firebase.html` ESKİ kopyadır (21 Eki 2026, Kasım değişiklikleri yok): düzenleme, `index.html`'in üzerine KOPYALAMA.
- **Canlı site:** https://apromuh-gif.github.io/A-PRO-CRM
- **GitHub:** apromuh-gif/A-PRO-CRM → `index.html` doğrudan yayınlanır
- **Firebase:** a-pro-crm projesi
- **NextAura:** Ticari marka adı

## Teklif Programı Entegrasyonu
Bu CRM, A-PRO Teklif Programı (Next.js/PostgreSQL) ile entegre edilmektedir.
Tam entegrasyon planı ve teknik detaylar:
`/Users/erkankaracakale/Desktop/CLAUDE-HAZIRLANAN PROJE DATABASE/A-PRO PLATFORM/A-PRO TEKLİF PROGRAMI/docs/crm-integration.md`

## Teknik Mimari
- Tek HTML dosyası — Firebase + Vanilla JS, framework yok
- Virtual DOM: `h(tag, attrs, ...children)` fonksiyonu
- State yönetimi: `state` objesi + `render()` + `setState()`
- Firebase Firestore: realtime sync
- PWA: iOS/Android ana ekrana eklenebilir

## Kritik Kurallar

### Değişiklik yaparken
1. Her değişikten sonra JS syntax test et:
```bash
node -e "
const fs=require('fs');
const html=fs.readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const main=scripts.sort((a,b)=>b[1].length-a[1].length)[0];   // ANA betik = en büyük <script> (son script küçük bir yardımcıdır)
const vm=require('vm');
try{new vm.Script(main[1]);console.log('✅ SYNTAX OK');}
catch(e){console.log('❌',e.message);}
"
```

2. String içinde Türkçe karakter varken tırnak sorununa dikkat et:
   - `'` (tek tırnak) içinde `'` kullanma
   - Türkçe karakterler için template literal veya HTML entity kullan

3. `h()` fonksiyonu `className` ve `id` özelliklerini destekler:
   - `className` → `el.className = v`
   - `id` → `el.setAttribute('id', v)`
   - `style` → `Object.assign(el.style, v)` (inline style, CSS'i ezer!)
   - **Uyarı:** CSS class ile gizleme çalışmaz, inline style kullan

4. Mobil kontrol: `window.innerWidth <= 768` (JS inline)
   - `orientationchange` ve `resize` event'lerde `render()` çağrılıyor

### GitHub'a yükleme
```bash
# index.html doğrudan düzenlenir (kopyalama adımı YOK — eski Firebase.html üzerine yazar)
git add index.html
git commit -m "v2.5+ güncelleme"
git push
```

## Önemli Fonksiyonlar

| Fonksiyon | Açıklama |
|---|---|
| `render()` | Tüm UI'ı yeniden çizer |
| `setState(obj)` | State günceller + render çağırır |
| `h(tag, attrs, ...children)` | DOM element oluşturur |
| `btn(label, onClick, bg, color, padding, extraStyle)` | Buton |
| `field(label, el, half?)` | Form alanı wrapper |
| `row(...children)` | Flex satır (mobilde column) |
| `modal(title, content, onClose, maxWidth)` | Modal pencere |
| `showNotification(key, title, body, type, targetUser)` | Bildirim |
| `playBeep(type)` | Ses çal (urgent/warning/info/win/lose) |
| `_toISO(d)` | Tarih → ISO format |
| `_toTR(d)` | Tarih → Türkçe format |
| `_toDate(d)` | Tarih → JS Date (timezone-safe) |
| `_diffDays(d)` | Bugüne kaç gün kaldı |
| `genId()` | Benzersiz ID üret |
| `today()` | Bugünün ISO tarihi |
| `stamp()` | `{updatedAt: today()}` |

## Firebase Koleksiyonları
- `customers`, `suppliers`, `opportunities`, `proposals`
- `services`, `serviceOpps`, `maintenances`
- `visits`, `appointments`, `users`
- `settings/config` (Gemini API key)
- `settings/targets` (yıllık hedefler)

## EmailJS Ayarları
- Service: `service_xm7vpad`
- Template: `template_tfhbxqv`
- Public Key: `aFlqv_CSdq9QliGtN`
- Template'te: `{{{body}}}` HTML render, `{{to_email}}` alıcı

## Dosya Yapısı
```
A-PRO CRM/
├── index.html               ← Ana CRM dosyası (canlı; bunu düzenle)
├── APRO_CRM_Firebase.html   ← ESKİ kopya (21 Eki) — kullanma
├── CLAUDE.md                ← Bu dosya
├── progress.md              ← Proje dokümantasyonu
├── KULLANIM_KILAVUZU.html   ← Kullanım kılavuzu (HTML)
└── KULLANIM_KILAVUZU.md     ← Kullanım kılavuzu (Markdown)
```

## Sık Yapılan Hatalar
1. `h()` içinde `className` ile CSS gizleme → inline style kullan
2. Tırnak içinde Türkçe kesme (') → `&#39;` veya template literal
3. `new Date("ISO")` → UTC sorunu → `_toDate()` kullan
4. `async/await` IIFE dışında → function'ı `async` yap
5. CSS `!important` inline style'ı ezemez → JS'de kontrol et

## FORM / PENCERE KURALLARI (ZORUNLU — bundan sonra açılacak TÜM form ve pencereler için)
Kullanıcı kararı (18 Kasım 2026): yeni yazılan her form/modal/açılır pencere şu kurallara uyar; eski kodda görürsen düzelt.
1. **Boşluğa (arka plana) tıklayınca KAPANMAZ.** Pencere yalnız Kaydet / İptal / Vazgeç / ✕ ile kapanır. `bg.addEventListener('click', …)` ile kapatma YAZMA. Yeni pencere için daima `modal(title, content, onClose, maxWidth)` kullan (kendi `position:fixed` overlay'ini yazma; yazarsan da boşluk tıklaması kapatmaz).
2. **Esc tuşu pencereyi/formu KAPATMAZ** (`keydown` + `Escape` ile kapatma yazma). (Yalnız küçük açılır menüler/bildirim paneli dış tıklama veya Esc ile kapanabilir; bunlar form değildir.)
3. **Doğrulama uyarısı formu sıfırlamaz.** Uyarı için `showToast(...)` kullan (pencere açıkken yeniden çizim yapmaz). Form açıkken `setState/render()` ile yeniden çizim tetikleme; yeniden çizim gerekiyorsa taslağı `PMOD`/üst kapsamda tut ki girilen bilgiler kaybolmasın. Kaydet başarısız olursa (hata) form AÇIK ve DOLU kalır, hata kırmızı uyarıyla gösterilir.
4. **Eksik/hatalı alan** adıyla söylenir ("… girilmelidir"); doğrulama Kaydet'e basınca yapılır, girilenler silinmez.
5. Yazdır / PDF ekranları da aynı: yalnız ✕ Kapat ile kapanır.
