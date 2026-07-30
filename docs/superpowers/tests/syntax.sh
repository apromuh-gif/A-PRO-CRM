#!/usr/bin/env bash
# APRO_CRM_Firebase.html ana <script> bloğunu vm.Script ile derleyerek JS syntax doğrular.
cd "$(dirname "$0")/../../.." || exit 1
node -e "
const fs=require('fs');
const html=fs.readFileSync('APRO_CRM_Firebase.html','utf8');
const scripts=[...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
const main=scripts.filter(s=>s[1].length>1000).pop();
const vm=require('vm');
try{new vm.Script(main[1]);console.log('✅ SYNTAX OK');}
catch(e){console.log('❌',e.message);process.exit(1);}
"
