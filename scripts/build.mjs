import { spawnSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
const demo=process.argv.includes('--demo')||process.env.DIATAR_BUILD_MODE==='demo';
const cli='node_modules/@angular/cli/bin/ng.js';
const r=spawnSync(process.execPath,[cli,'build','--configuration',demo?'demo':'production'],{stdio:'inherit'});
if(r.status!==0)process.exit(r.status||1);
copyFileSync('dist/index.html','dist/404.html');
