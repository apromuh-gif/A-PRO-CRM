const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
const { _addMonth, _addDay } = load(['_ymd','_addMonth','_addDay']);

eq(_addMonth('2026-01-15', 1),  '2026-02-15', 'ay ekle normal');
eq(_addMonth('2026-01-31', 1),  '2026-02-28', 'ay sonu clamp (28)');
eq(_addMonth('2024-01-31', 1),  '2024-02-29', 'artık yıl Şubat clamp (29)');
eq(_addMonth('2026-11-30', 3),  '2027-02-28', 'yıl sınırı + clamp');
eq(_addMonth('2026-01-15', 12), '2027-01-15', 'yıl ekle');
eq(_addMonth('', 1),            '',           'boş girdi');
eq(_addDay('2026-01-15', 20),   '2026-02-04', 'gün ekle ay taşması');
eq(_addDay('2026-12-25', 10),   '2027-01-04', 'gün ekle yıl taşması');
done();
