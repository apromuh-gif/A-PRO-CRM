const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
// clComputeNextDue 'haftalik' dalı _addDay çağırır (HTML'de mevcut).
const { clVisitItems, clComputeNextDue } = load(['_clTemplates','clItems','clFreqRank','clVisitItems','_ymd','_addDay','_addMonth','clComputeNextDue']);

const yr = clVisitItems({sysKey:'sprinkler', subType:'islak', visitFreq:'yillik'});
eq(yr.some(i=>i.freq==='aylik'), true, 'yıllık ziyaret aylık maddeleri de içerir');
eq(yr.some(i=>i.freq==='5yillik'), false, '5-yıllık madde yıllık ziyarette görünmez');

const mo = clVisitItems({sysKey:'sprinkler', subType:'islak', visitFreq:'aylik'});
eq(mo.every(i=>['haftalik','aylik'].includes(i.freq)), true, 'aylık ziyaret yalnız haftalık+aylık');

// frekans seçilmezse tüm alt-tip maddeleri döner
const all = clVisitItems({sysKey:'sprinkler', subType:'islak', visitFreq:''});
eq(all.length >= yr.length, true, 'frekanssız = tüm maddeler');

eq(clComputeNextDue('2026-01-15','aylik'),   '2026-02-15', 'sonraki vade aylık');
eq(clComputeNextDue('2026-01-15','3aylik'),  '2026-04-15', 'sonraki vade 3 aylık');
eq(clComputeNextDue('2026-01-15','6aylik'),  '2026-07-15', 'sonraki vade 6 aylık');
eq(clComputeNextDue('2026-01-15','yillik'),  '2027-01-15', 'sonraki vade yıllık');
eq(clComputeNextDue('2026-01-15','haftalik'),'2026-01-22', 'sonraki vade haftalık');
eq(clComputeNextDue('2026-01-31','aylik'),   '2026-02-28', 'ay sonu taşması güvenli');
eq(clComputeNextDue('','aylik'), '', 'baz yok → boş');
eq(clComputeNextDue('2026-01-15','yok'), '', 'bilinmeyen frekans → boş');
done();
