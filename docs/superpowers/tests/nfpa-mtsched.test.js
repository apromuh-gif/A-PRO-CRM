const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
// _addMonth 'HTML'de mevcut; _ymd bağımlılığı da yüklenir. today/_toDate DEPS'te.
const {
  mtFreqMonths, mtSysFirstDue, mtRecordNextDue,
  mtSystemsDueOn, mtAdvanceSystem, mtCompleteVisit
} = load(['_ymd','_addMonth','mtFreqMonths','mtSysFirstDue','mtRecordNextDue','mtSystemsDueOn','mtAdvanceSystem','mtCompleteVisit']);

// periyot → ay
eq(mtFreqMonths('3aylik'), 3, '3aylik=3 ay');
eq(mtFreqMonths('6aylik'), 6, '6aylik=6 ay');
eq(mtFreqMonths('yillik'), 12, 'yillik=12 ay');
eq(mtFreqMonths('yok'), 0, 'bilinmeyen=0');

// ilk vade = baz + 1 periyot
eq(mtSysFirstDue('2026-01-01','3aylik'), '2026-04-01', '3 aylık ilk vade Ay 3');
eq(mtSysFirstDue('2026-01-01','6aylik'), '2026-07-01', '6 aylık ilk vade Ay 6');
eq(mtSysFirstDue('2026-01-01','yok'), '', 'bilinmeyen periyot boş');

// ── Kullanıcı senaryosu: 3 aylık X + 6 aylık Y, baz 2026-01-01 ──
var base = '2026-01-01';
var systems = [
  { sysKey:'sprinkler', freq:'3aylik', due: mtSysFirstDue(base,'3aylik') },
  { sysKey:'pompa',     freq:'6aylik', due: mtSysFirstDue(base,'6aylik') }
];

// Kayıt vadesi = en erken (Ay 3)
eq(mtRecordNextDue(systems), '2026-04-01', 'kayıt vadesi = min = Ay 3');

// Ziyaret 1 @ Ay 3: yalnız X vadesi gelir
var v1 = mtSystemsDueOn(systems, '2026-04-01');
eq(v1.length, 1, 'Ay 3 ziyaretinde 1 sistem');
eq(v1[0].sysKey, 'sprinkler', 'Ay 3 = yalnız sprinkler (3 aylık)');
systems = mtCompleteVisit(systems, '2026-04-01');
eq(systems[0].due, '2026-07-01', 'X ileri sardı → Ay 6');
eq(systems[1].due, '2026-07-01', 'Y dokunulmadı → Ay 6');

// Ziyaret 2 @ Ay 6: X + Y birlikte
eq(mtRecordNextDue(systems), '2026-07-01', 'kayıt vadesi = Ay 6');
var v2 = mtSystemsDueOn(systems, '2026-07-01');
eq(v2.length, 2, 'Ay 6 ziyaretinde 2 sistem (birlikte)');
systems = mtCompleteVisit(systems, '2026-07-01');
eq(systems[0].due, '2026-10-01', 'X → Ay 9');
eq(systems[1].due, '2027-01-01', 'Y → Ay 12');

// Ziyaret 3 @ Ay 9: yalnız X
eq(mtRecordNextDue(systems), '2026-10-01', 'kayıt vadesi = Ay 9');
var v3 = mtSystemsDueOn(systems, '2026-10-01');
eq(v3.length, 1, 'Ay 9 ziyaretinde 1 sistem');
eq(v3[0].sysKey, 'sprinkler', 'Ay 9 = yalnız sprinkler');
systems = mtCompleteVisit(systems, '2026-10-01');
eq(systems[0].due, '2027-01-01', 'X → Ay 12');

// Ziyaret 4 @ Ay 12: X + Y birlikte (yıl 4 ziyaret tamam)
eq(mtRecordNextDue(systems), '2027-01-01', 'kayıt vadesi = Ay 12');
var v4 = mtSystemsDueOn(systems, '2027-01-01');
eq(v4.length, 2, 'Ay 12 ziyaretinde 2 sistem (birlikte)');

// kayma testi: erken tamamlanınca bile vade orijinal grid'de kalır
var s2 = [{ sysKey:'x', freq:'3aylik', due:'2026-04-01' }];
s2 = mtCompleteVisit(s2, '2026-03-20'); // erken tamamlandı ama due<=visit değil → değişmez
eq(s2[0].due, '2026-04-01', 'vadesi gelmeyen sistem erken ziyarette ilerlemez');

// boş / kenar durumlar
eq(mtRecordNextDue([]), '', 'sistem yok → boş vade');
eq(mtSystemsDueOn(systems, ''), [], 'ziyaret tarihi yok → boş');
done();
