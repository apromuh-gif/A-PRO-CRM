#!/usr/bin/env bash
# APRO_CRM_Firebase.html ana <script> bloğunu vm.Script ile derleyerek JS syntax doğrular.
cd "$(dirname "$0")/../../.." || exit 1
node -e "
const fs=require('fs');
const html=fs.readFileSync('APRO_CRM_Firebase.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const big=scripts.filter(s=>s[1].length>1000);
const vm=require('vm');
let ok=true;
big.forEach((s,i)=>{
  try{new vm.Script(s[1]);}
  catch(e){ok=false;console.log('❌ script #'+i+' ('+s[1].length+' chars):',e.message);}
});
if(ok)console.log('✅ SYNTAX OK ('+big.length+' script blogu)');
else process.exit(1);
"
