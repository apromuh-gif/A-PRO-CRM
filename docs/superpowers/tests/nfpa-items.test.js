const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
const { clItems } = load(['_clTemplates','clItems']);

// sprinkler bakım — ıslak alt-tip: genel + islak maddeleri gelir, kuru sızmaz
const wet = clItems('bakim','sprinkler','islak');
eq(wet.length>0, true, 'sprinkler/bakim/islak dolu');
eq(wet.every(i=>!i.sub || i.sub==='islak'), true, 'kuru/ontepkili maddeleri sızmaz');
eq(wet.some(i=>i.freq==='yillik'), true, 'yıllık madde var');
eq(wet.some(i=>i.kod==='spr_w1'), true, 'islak özel maddesi var');
eq(wet.some(i=>i.kod==='spr_k1'), false, 'kuru maddesi ıslakta yok');

// kuru alt-tip: kuru maddeler gelir, islak gelmez
const dry = clItems('bakim','sprinkler','kuru');
eq(dry.some(i=>i.kod==='spr_k1'), true, 'kuru maddesi kuruda var');
eq(dry.some(i=>i.kod==='spr_w1'), false, 'islak maddesi kuruda yok');

// pompa dizel alt-tip
const dizel = clItems('bakim','pompa','dizel');
eq(dizel.some(i=>i.kod==='pmp_m2'), true, 'dizel çalıştırma maddesi var');
const elk = clItems('bakim','pompa','elektrik');
eq(elk.some(i=>i.kod==='pmp_m2'), false, 'dizel maddesi elektrikte yok');

// arıza — freq yok, düz liste; 8 sistemin hepsi dolu
['sprinkler','pompa','hidrant_dolap','su_deposu','kopuk','algilama','gazli','davlumbaz'].forEach(function(s){
  eq(clItems('ariza',s,'').length>0, true, s+'/ariza dolu');
  eq(clItems('devreye',s,'').length>0, true, s+'/devreye dolu');
  eq(clItems('bakim',s,'').length>0, true, s+'/bakim dolu');
});

// bilinmeyen → boş dizi
eq(clItems('bakim','yokolan',''), [], 'bilinmeyen sistem boş dizi');
eq(clItems('yokform','sprinkler',''), [], 'bilinmeyen form boş dizi');
done();
