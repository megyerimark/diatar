import { existsSync, copyFileSync, closeSync, openSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
if (!existsSync('backend/.env')) copyFileSync('backend/.env.example','backend/.env');
if (!existsSync('backend/database/database.sqlite')) closeSync(openSync('backend/database/database.sqlite','a'));
for(const [cmd,args,cwd] of [['composer',['install'],'backend'],['php',['artisan','key:generate'],'backend'],['php',['artisan','migrate','--force'],'backend'],['npm',['ci'],'.']]) {
 // Never rotate an existing key: existing encrypted sessions should remain usable.
 if(cmd==='php'&&args.includes('key:generate')){
  const {readFileSync}=await import('node:fs');if(/^APP_KEY=.+$/m.test(readFileSync('backend/.env','utf8')))continue;
 }
 const r=spawnSync(cmd,args,{cwd,stdio:'inherit',shell:process.platform==='win32'});if(r.status!==0)process.exit(r.status||1);
}
console.log('Kész. Külön terminálokban: backend/php artisan serve; backend/php artisan queue:work --timeout=100; npm start');
