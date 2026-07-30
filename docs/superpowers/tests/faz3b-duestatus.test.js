const { load } = require('./faz3b-harness');
const { eq, done } = require('./_assert');
const { maintIsTracked, maintDueStatus, maintDaysLeft } = load([
  'maintPeriod','maintPeriodDays','maintNextDue','maintLastDone','maintHistory',
  'maintIsTracked','maintDueStatus','maintDaysLeft'
]);

// bugüne göreli ISO tarih üret
const iso = n => { const d=new Date(); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };

eq(maintIsTracked({}),                                    false,      'takipsiz: alan yok');
eq(maintIsTracked({mtPeriod:'aylik'}),                    false,      'takipsiz: nextDue yok');
eq(maintIsTracked({mtPeriod:'aylik', mtNextDue:iso(5)}),  true,       'takipte');
eq(maintDueStatus({}),                                    '',         'takipsiz → status boş');
eq(maintDueStatus({mtPeriod:'aylik', mtNextDue:iso(-3)}), 'geciken',  'vade 3 gün geçmiş');
eq(maintDueStatus({mtPeriod:'aylik', mtNextDue:iso(10)}), 'yaklasan', '10 gün kaldı');
eq(maintDueStatus({mtPeriod:'aylik', mtNextDue:iso(15)}), 'yaklasan', 'sınır 15 gün dahil');
eq(maintDueStatus({mtPeriod:'aylik', mtNextDue:iso(30)}), 'planli',   '30 gün → planlı');
eq(maintDaysLeft({mtPeriod:'aylik', mtNextDue:iso(7)}),   7,          'kalan 7 gün');
eq(maintDaysLeft({}),                                     null,       'takipsiz → null');
done();
