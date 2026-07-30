const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
const { computeNextDue } = load(['_ymd','_addMonth','_addDay','computeNextDue']);

eq(computeNextDue('2026-01-15','aylik',0),  '2026-02-15','aylik +1 ay');
eq(computeNextDue('2026-01-15','3aylik',0), '2026-04-15','3aylik +3 ay');
eq(computeNextDue('2026-01-15','6aylik',0), '2026-07-15','6aylik +6 ay');
eq(computeNextDue('2026-01-15','yillik',0), '2027-01-15','yillik +12 ay');
eq(computeNextDue('2026-01-15','ozel',45),  '2026-03-01','ozel +45 gün');
eq(computeNextDue('2026-01-31','aylik',0),  '2026-02-28','aylik ay-sonu clamp');
eq(computeNextDue('2026-01-15','ozel',0),   '','ozel ama gün 0 → boş');
eq(computeNextDue('2026-01-15','',0),       '','periyot yok → boş');
eq(computeNextDue('','aylik',0),            '','baz tarih yok → boş');
done();
