const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
// today harness DEPS'inde hazır — load listesine EKLEME.
const { normChecklist } = load(['normChecklist']);

const n = normChecklist({ id:'x', customerId:'c1' });
eq(n.formType, 'bakim', 'formType default bakim');
eq(Array.isArray(n.systems), true, 'systems dizi');
eq(n.siteName, '', 'siteName default boş');
eq(n.status, 'taslak', 'status default taslak');
eq(n.staffSign && typeof n.staffSign, 'object', 'staffSign obje');
eq(n.custSign.name, '', 'custSign.name boş');
eq(n.customerId, 'c1', 'gelen alan korunur');
eq(typeof n.createdAt, 'string', 'createdAt dolduruldu');

// bozuk systems → dizi
const b = normChecklist({ systems: 'bozuk' });
eq(Array.isArray(b.systems), true, 'bozuk systems dizi olur');

// kısmi imza objesi tamamlanır
const p = normChecklist({ staffSign:{name:'Ali'} });
eq(p.staffSign.name, 'Ali', 'staffSign.name korunur');
eq(p.staffSign.dataURL, '', 'staffSign.dataURL tamamlanır');
done();
