# A-PRO Mühendislik CRM — Claude Code Talimatları

## Proje Özeti
- **Ana dosya:** `APRO_CRM_Firebase.html` (tek dosya uygulama, ~326KB)
- **Canlı site:** https://apromuh-gif.github.io/A-PRO-CRM
- **GitHub:** apromuh-gif/A-PRO-CRM → `index.html` olarak yüklenir
- **Firebase:** a-pro-crm projesi
- **Nexora:** Ticari marka adı

## Teklif Programı Entegrasyonu
Bu CRM, A-PRO Teklif Programı (Next.js/PostgreSQL) ile entegre edilmektedir.
Tam entegrasyon planı ve teknik detaylar:
`/Users/erkankaracakale/Desktop/CLAUDE-HAZIRLANAN PROJE DATABASE/A-PRO TEKLİF PROGRAMI/docs/crm-integration.md`

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
const html=fs.readFileSync('APRO_CRM_Firebase.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const main=scripts.filter(s=>s[1].length>1000).pop();
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
# APRO_CRM_Firebase.html → index.html olarak kopyala
cp APRO_CRM_Firebase.html index.html

# Git ile yükle
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
- `settings/config` (Groq API key)
- `settings/targets` (yıllık hedefler)

## EmailJS Ayarları
- Service: `service_xm7vpad`
- Template: `template_tfhbxqv`
- Public Key: `aFlqv_CSdq9QliGtN`
- Template'te: `{{{body}}}` HTML render, `{{to_email}}` alıcı

## Dosya Yapısı
```
A-PRO CRM/
├── APRO_CRM_Firebase.html   ← Ana CRM dosyası (bunu düzenle)
├── CLAUDE.md                ← Bu dosya
├── progress.md              ← Proje dokümantasyonu
├── Nexora_Website.html      ← Nexora web sitesi
├── Nexora_Fiyat_Listesi_v2.html  ← Nexora fiyat listesi
└── Nexora_Logo_Alternatifler.html ← Logo seçenekleri
```

## Sık Yapılan Hatalar
1. `h()` içinde `className` ile CSS gizleme → inline style kullan
2. Tırnak içinde Türkçe kesme (') → `&#39;` veya template literal
3. `new Date("ISO")` → UTC sorunu → `_toDate()` kullan
4. `async/await` IIFE dışında → function'ı `async` yap
5. CSS `!important` inline style'ı ezemez → JS'de kontrol et
