# A-PRO Servis-Devreye Alma Formu (Tasarım / Spec)

**Tarih:** 2026-08-29
**Kapsam:** Arıza (servis), Periyodik Bakım ve Devreye Alma hizmetlerinde, müşteriye hizmetin verildiğinin dijital imzalı delili olan yeni, ayrı bir form. Mevcut NFPA Checklist sistemine (`docs/superpowers/specs/2026-08-03-nfpa25-checklist-design.md`) **dokunmadan**, onunla yan yana çalışır.
**Dışında:** NFPA Checklist'in kendisi (değişmiyor), Teklif Programı entegrasyonu, ıslak imzanın dijital olarak zorunlu kılınması (ıslak imza ayrıca/sonradan alınabilir — bu form için değil).

---

## 1. Amaç ve İki Belgenin Ayrımı

Bu oturumda ortaya çıkan netleşme: A-Pro'nun sahada ürettiği iki belge **farklı amaçlara** hizmet eder ve **ayrı belgeler** olarak kalmalı:

| | Checklist (NFPA) | Servis-Devreye Alma Formu (yeni) |
|---|---|---|
| **Amaç** | Yapılması gereken teknik kontroller yapıldı mı — A-Pro'nun **iç mühendislik kaydı** | Hizmetin müşteriye **verildiğinin delili** |
| **İçerik** | Sistem/komponent bazlı tik tablosu (✔/✗/N/A), frekans filtreli | Hizmet türü + tesisteki sistemler (seçilebilir) + yapılan işin özeti + taraf bilgileri |
| **Zorunluluk** | Devreye Alma + Periyodik Bakım'da zorunlu; Arızada değil | **Üçünde de zorunlu** |
| **İmza** | Personel + Müşteri (değişmiyor) | Personel + Müşteri (yeni) |

İki belge **aynı kayda** (maintenance/service/project) bağlanır ama **bağımsız** doldurulur, **bağımsız** imzalanır, **bağımsız** PDF'leri vardır.

## 2. Veri Modeli — Yeni `serviceForms` Koleksiyonu

Mevcut `checklists` koleksiyonunun deseni birebir izlenir (okuma-anı default, `linkType`/`linkId` bağı, imza yapısı) ama **ayrı koleksiyon**:

```
serviceForm = {
  id,
  docType,             // 'ariza' | 'devreye' | 'bakim' — kırmızı kart, tekli seçim
  customerId,
  siteName,            // serbest "Saha / Bina adı" (checklist ile aynı desen)
  projectId,           // ops — devreye alma için; yoksa ''
  linkType,            // '' | 'maintenance' | 'service' | 'project'
  linkId,
  systemsPresent: [sysKey, ...],   // tesisteki sistemler — kırmızı kart, çoklu seçim (SYS_META'dan)
  description,          // "Yapılan hizmet" — serbest metin
  custContact: { name, phone },    // Müşteri ilgilisi
  staffContact: { name, phone },   // Servis hizmeti veren personel (varsayılan: bağlı kaydın serviceContact/preparedBy'ı)
  staffSign: { name, dataURL, at },
  custSign:  { name, dataURL, at },
  status,               // 'taslak' | 'tamam' — clSave ile birebir aynı mantık: ikisi de imzalanınca 'tamam'
  createdAt,
  _editedBy, _editedAt
}
```

`linkType:'project'` zaten mevcut kullanımla birebir aynıdır (`buildProjeModal`'daki checklist bağlama satırı `linkType:'project'` kullanıyor — spec'teki eski `''` varsayımı yanlıştı, kod zaten `'project'` kullanıyor; bu doküman kodu esas alır).

## 3. Fonksiyonlar — `cl*` Deseninin `sf*` Karşılığı

Mevcut checklist fonksiyonlarının birebir paraleli, aynı isimlendirme öneki ile ama `sf` (service form):

| Yeni | Mevcut karşılığı (model alınan) |
|---|---|
| `SF_DOCTYPE_META` | `FORMTYPE_META` — `{ariza:'Arıza Servis Formu', devreye:'Devreye Alma Servis Formu', bakim:'Periyodik Bakım Servis Formu'}` (checklist'in `FORMTYPE_META`siyle karışmasın diye farklı metinler) |
| `normServiceForm(sf)` | `normChecklist(c)` |
| `sfSave(sf)` | `clSave(c)` — `sf.status = (staffSign.name && custSign.name) ? 'tamam' : 'taslak'` |
| `sfDelete(id)` | `clDelete(id)` |
| `openServiceForm(opts)` | `openChecklist(opts)` |
| `sfHasFreshCompleted(linkType, linkId, sinceISO)` | bu oturumda eklenen `clHasFreshCompleted` — aynı mantık, `state.serviceForms` üzerinde |
| `sfListBlock(opts)` | `clListBlock(opts)` — giriş noktası + liste + Aç/PDF butonları |
| `buildServiceFormModal(sf)` | `buildChecklistModal(c)` — doldurma ekranı |
| `printServiceForm(sf)` | `printChecklist(c)` — PDF |

**İmza:** `clSignPad(c, sign, label, canvasId, nameList)` **aynen yeniden kullanılır** — `c` parametresi fonksiyon gövdesinde hiç kullanılmıyor (kontrol edildi), `_clRerender()` da genel (`setState({modal:state.modal})`, checklist'e özgü değil). Yeni bir imza bileşeni yazmaya gerek yok.

## 4. UI — Kırmızı Kart Seçici (yeni, paylaşılan bileşen)

Kullanıcının tarif ettiği "tıklanınca kutunun tamamı kırmızı dolan" davranış için yeni, genel bir yardımcı:

```js
function clRedCard(label, selected, onClick){
  return h('div',{onClick:onClick, style:{
    padding:'10px 14px', borderRadius:'8px',
    border:'1.5px solid '+(selected?'#dc2626':'#cbd5e1'),
    background:selected?'#dc2626':'#fff', color:selected?'#fff':'#334155',
    fontWeight:'700', fontSize:'12.5px', cursor:'pointer', textAlign:'center',
    userSelect:'none', flex:'1 1 auto', minWidth:'110px'
  }}, label);
}
```

İki yerde kullanılır:
1. **Hizmet türü** (docType) — 3 kart (Arıza / Devreye Alma / Periyodik Bakım), **tekli seçim** (birine tıklayınca diğerleri otomatik seçimsiz kalır).
2. **Tesisteki sistemler** (systemsPresent) — `SYS_META` listesinden kartlar, **çoklu seçim** (her karta tıklama kendi seçili/seçisiz durumunu bağımsız değiştirir — toggle).

## 5. Doldurma Ekranı — `buildServiceFormModal(sf)`

Sırasıyla:
1. Başlık: müşteri + saha adı + docType etiketi.
2. **Hizmet Türü** — 3 kırmızı kart (tekli).
3. Müşteri seçici (`sel()`, mevcut desen) + Saha/Bina adı (serbest metin) + Proje (ops, devreye almada).
4. **Tesisteki Sistemler** — kırmızı kart grid (çoklu).
5. **Yapılan Hizmet** — serbest metin `<textarea>`.
6. **Müşteri İlgilisi** — ad + telefon (2 input).
7. **Servis Personeli** — ad + telefon (2 input; ad alanı varsayılan olarak bağlı kaydın `serviceContact`/`preparedBy` alanından önerilir, elle değiştirilebilir).
8. İmza bölümü — `clSignPad` ile personel + müşteri (yan yana, `row()`).
9. Kaydet (`sfSave`) / İptal.

## 6. PDF — `printServiceForm(sf)`

`printChecklist`'in print-overlay + `window.print()` deseni birebir izlenir (yeni bir yazdırma altyapısı kurulmaz):
- Üst bilgi: Teklif Programı PDF'indeki gibi — solda `APRO_LOGO_DATAURI` (mevcut, checklist'te zaten kullanılan logo), sağda şirket bilgi bloğu (yeni sabit `APRO_LETTERHEAD`):
  ```
  A-PRO MÜHENDİSLİK LTD. ŞTİ.
  Batı Sitesi Mah. 2307/2. Sk. No:13 Yenimahalle — Ankara / Türkiye
  Tel: +90 (312) 481 25 00
  E-posta: info@a-pro.com.tr
  www.a-pro.com.tr
  ```
  Altında kırmızı (#dc2626 veya mevcut marka kırmızısı) ayırıcı çizgi — Teklif PDF'indeki desenle aynı. Başlık (`SF_DOCTYPE_META[sf.docType]`) bu üst bilginin altında, kayıt bilgi tablosunun üstünde yer alır.
- Müşteri/proje/saha bilgi satırı.
- Hizmet türü + tesisteki sistemler (seçili olanlar) — rozet/etiket olarak.
- Yapılan hizmet açıklaması.
- Müşteri ilgilisi / servis personeli bilgi satırları.
- İmza blokları — `printChecklist`teki `signBox` aynen kullanılır (dijital imza görseli + ıslak imza satırı).
- `@media print` ile buton/gölge gizlenir (mevcut desen).

## 7. Giriş Noktaları

Mevcut `clListBlock` çağrılarının yanına, aynı yerde, aynı desende `sfListBlock` eklenir:
- `buildArizaModal` (satır ~5946 civarı, mevcut `clListBlock({linkType:'service',...})`'in yanına).
- `buildBakimModal` — bakım **Geçmiş** modalı (satır ~7725 civarı, mevcut `clListBlock({linkType:'maintenance',...})`'in yanına). Checklist giriş noktası zaten burada olduğu için aynı yerde tutuluyor.
- `buildProjeModal` (satır ~8384 civarı, mevcut `clListBlock({linkType:'project',...})`'in yanına).

## 8. Kapatma Kilidi — Nihai Karar

| Eylem | Checklist zorunlu mu | Servis Formu zorunlu mu |
|---|---|---|
| `servClose(s)` — Arızayı Kapat | **Hayır** | **Evet** |
| `maintVisitDone(m)` / `maintDone(m)` — Bakımı Tamamla | Evet (bu oturumda zaten eklendi, dokunulmuyor) | **Evet (yeni)** |
| `projClose(o)` — Projeyi Kapat (Devreye Alma) | **Evet (yeni)** | **Evet (yeni)** |

`sfHasFreshCompleted(linkType, linkId, sinceISO)` — `clHasFreshCompleted` ile birebir aynı mantık: son ziyaretten/tamamlanmadan SONRA imzalanmış taze bir form aranır (periyodik bakımda bir önceki ziyaretin formu bir sonraki ziyareti geçerli kılmaz). `servClose`/`projClose` tekrarlayan olmadığı için `sinceISO=''` (herhangi bir zamanda tamamlanmış form yeterli).

`projClose`'a checklist kilidi eklenirken `clHasFreshCompleted('project', o.id, '')` kullanılır — `sinceISO` boş, çünkü proje kapanışı tek seferliktir (periyodik bakımdaki gibi tekrarlayan ziyaret kavramı yok).

## 9. Geriye Uyumluluk

- Mevcut checklist sistemi (`checklists` koleksiyonu, `clSave`/`clListBlock`/`buildChecklistModal`/`printChecklist`) **hiç değişmez**.
- Yeni `serviceForms` koleksiyonu boş başlar; eski servis/bakım/proje kayıtlarında henüz form yok — bu kayıtlar için ilk kapatma denemesinde "önce form doldurulmalı" uyarısı çıkar (beklenen davranış, geriye dönük veri migrasyonu gerekmez).

## 10. Doğrulama

- JS syntax: `node vm.Script` → `✅ SYNTAX OK` (her değişiklikten sonra).
- Manuel: Arıza kaydı aç → Servis Formu doldur (docType=Arıza, sistem seç, açıklama yaz, iki imza at) → Kaydet → Arızayı Kapat artık engellenmiyor. Aynı işlemi imzasız dener → engelleniyor. Periyodik bakımda hem Checklist hem Servis Formu imzalanmadan Ziyareti Tamamla engelleniyor. Devreye almada Projeyi Kapat için aynı iki kilit. PDF çıktısı: logo + başlık + seçili kartlar + imza blokları doğru görünüyor.

## 11. Kapsam Dışı

- Servis Formu'nun kendi içinde ayrıca bir NFPA-tarzı tik tablosu **yoktur** — bu bilinçli bir sınır, checklist'in işi bu, tekrar edilmiyor.
- Şirket üst bilgi metni kullanıcıdan alınıp §6'ya işlendi (Teklif Programı PDF ekran görüntüsünden) — açık soru kalmadı.
