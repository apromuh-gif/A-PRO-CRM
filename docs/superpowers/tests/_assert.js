let failures = 0;
function eq(actual, expected, msg){
  const a = JSON.stringify(actual), e = JSON.stringify(expected);
  if(a === e){ console.log('  ✓ ' + msg); }
  else { failures++; console.log('  ✗ ' + msg + '\n      expected ' + e + '\n      got      ' + a); }
}
function done(){
  if(failures){ console.log('\n❌ ' + failures + ' test(s) failed'); process.exit(1); }
  console.log('\n✅ all passed'); process.exit(0);
}
module.exports = { eq, done };
