import { Access, ApiError, Classroom, Folder, Presentation, User } from './models';
interface State { user:User; folders:Folder[]; presentations:Presentation[]; accesses:(Access & {code:string})[]; loggedIn:boolean; classroomId:number|null }
const key='diatar-demo-v1';
let sequence=Date.now();const nextId=()=>sequence=Math.max(sequence+1,Date.now());
const initial=():State=>({user:{id:1,name:'Kovács Anna',email:'anna@example.com',storage_limit_bytes:1073741824,used_bytes:0},loggedIn:false,classroomId:null,
 folders:[{id:1,name:'Üzleti tervezés',color:'#d3bd9b'},{id:2,name:'Matematika',color:'#bac9d5'},{id:3,name:'Digitális kultúra',color:'#c5cfae'}],
 presentations:[
 {id:1,title:'Az ötlettől az üzleti modellig',original_name:'uzleti-modell.pdf',extension:'pdf',size_bytes:218640,preview_size_bytes:0,folder_id:1,status:'ready',created_at:new Date().toISOString()},
 {id:2,title:'Függvények, érthetően',original_name:'fuggvenyek.pdf',extension:'pdf',size_bytes:194500,preview_size_bytes:0,folder_id:2,status:'ready',created_at:new Date(Date.now()-86400000).toISOString()},
 {id:3,title:'Az első sor kód',original_name:'digitalis-kultura.pdf',extension:'pdf',size_bytes:182400,preview_size_bytes:0,folder_id:3,status:'ready',created_at:new Date(Date.now()-172800000).toISOString()}],accesses:[]});
function read():State {try { const raw=localStorage.getItem(key);return raw?JSON.parse(raw):initial(); }catch{return initial();}}
function save(s:State){s.user.used_bytes=s.presentations.reduce((n,p)=>n+p.size_bytes+p.preview_size_bytes,0);localStorage.setItem(key,JSON.stringify(s));}
function decorated(s:State,p:Presentation):Presentation{return {...p,folder:s.folders.find(f=>f.id===p.folder_id)||null};}
async function db():Promise<IDBDatabase> {return new Promise((resolve,reject)=>{const q=indexedDB.open('diatar-demo-files',1);q.onupgradeneeded=()=>q.result.createObjectStore('files');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(new Error('A böngésző helyi tárhelye nem érhető el.'));});}
async function putFile(k:string,b:Blob){const d=await db();try{await new Promise<void>((resolve,reject)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').put(b,k);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{d.close();}}
async function getFile(k:string):Promise<Blob|undefined>{const d=await db();try{return await new Promise((resolve,reject)=>{const q=d.transaction('files').objectStore('files').get(k);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}finally{d.close();}}
async function deleteFile(k:string){const d=await db();try{await new Promise<void>((resolve,reject)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').delete(k);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}finally{d.close();}}
export async function demoRequest(path:string,method='GET',body?:any):Promise<any>{
 const s=read();const b=body||{};const match=path.match(/\/(\d+)(?:\/(file|preview|retry))?$/);const id=match?Number(match[1]):0;
 const p=s.presentations.find(x=>x.id===id);const owner=()=>{if(!s.loggedIn)throw new ApiError('Jelentkezz be a tárhelyedhez.',401);};
 const access=()=>{const a=s.accesses.find(x=>x.id===s.classroomId);if(!a||a.revoked_at||Date.parse(a.expires_at)<=Date.now())throw new ApiError('A hozzáférés lejárt vagy lezárták.',403);return a;};
 if(path==='/csrf'||path==='/health')return {ok:true};
 if(path==='/auth/me'){owner();save(s);return {user:s.user};}
 if(path==='/auth/login'||path==='/auth/register'){s.loggedIn=true;if(path.endsWith('register')){s.user.name=b.name;s.user.email=b.email;}save(s);return {user:s.user};}
 if(path==='/auth/logout'){s.loggedIn=false;save(s);return {message:'Kijelentkeztél.'};}
 if(path==='/auth/forgot-password'||path==='/auth/reset-password')throw new ApiError('Az emailes jelszó-visszaállítás az éles szerverrel működik. A demót a Bemutató megnyitása gombbal próbálhatod ki.',422);
 if(path==='/auth/profile'){owner();s.user.name=b.name;save(s);return {user:s.user};}
 if(path==='/classroom/enter'){
  const code=String(b.code).toUpperCase().replace(/[^A-Z0-9]/g,'');const a=s.accesses.find(x=>x.code.replace('-','')===code&&!x.revoked_at&&Date.parse(x.expires_at)>Date.now());
  if(!a)throw new ApiError('A kód érvénytelen vagy lejárt. A demóban előbb hozz létre kódot a Saját tárhelyen.',422);
  s.classroomId=a.id;save(s);return classroom(s,a);
 }
 if(path==='/classroom/leave'){s.classroomId=null;save(s);return {};}
 if(path==='/classroom')return classroom(s,access());
 if(path.startsWith('/classroom/presentations/')){const a=access();if(!a.presentations.some(x=>x.id===id))throw new ApiError('Ez az anyag nem része a hozzáférésnek.',404);if(path.endsWith('/file')&&!a.allow_download)throw new ApiError('A letöltés nem engedélyezett.',403);}
 else owner();
 if(path==='/folders'){
  if(method==='GET')return s.folders.map(f=>({...f,presentations_count:s.presentations.filter(p=>p.folder_id===f.id).length}));
  const f={id:nextId(),name:b.name,color:b.color};s.folders.push(f);save(s);return f;
 }
 if(path.startsWith('/folders/')){const f=s.folders.find(f=>f.id===id);if(!f)throw new ApiError('A mappa nem található.',404);if(method==='DELETE'){s.folders=s.folders.filter(f=>f.id!==id);s.presentations.forEach(p=>{if(p.folder_id===id)p.folder_id=null;});}else Object.assign(f,b);save(s);return f;}
 if(path==='/presentations'){
  if(method==='GET')return s.presentations.map(p=>decorated(s,p));
  const file=(body as FormData).get('file') as File;const ext=file.name.split('.').pop()?.toLowerCase();
  if(!['pdf','pptx'].includes(ext||''))throw new ApiError('PDF vagy PPTX fájlt válassz.',422);
  if(file.size>52428800)throw new ApiError('A fájl legfeljebb 50 MB lehet.',422);
  if(s.user.used_bytes+file.size>s.user.storage_limit_bytes)throw new ApiError('Megtelt a demótárhely.',422);
  const item:Presentation={id:nextId(),title:String(body.get('title')||file.name.replace(/\.[^.]+$/,'')),original_name:file.name,extension:ext!,size_bytes:file.size,preview_size_bytes:0,folder_id:Number(body.get('folder_id'))||null,status:ext==='pdf'?'ready':'failed',created_at:new Date().toISOString(),conversion_error:ext==='pptx'?'A demóban tölts fel PDF-változatot a vetítéshez. Az automatikus átalakítást a Laravel-szerver végzi.':null};
  await putFile(item.id+'/file',file);s.presentations.unshift(item);save(s);return decorated(s,item);
 }
 if(path==='/access-codes'){
  if(method==='GET')return s.accesses.map(a=>({...a,presentations:a.presentations.map(x=>s.presentations.find(p=>p.id===x.id)).filter(Boolean)}));
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';const arr=crypto.getRandomValues(new Uint8Array(10));const code=Array.from(arr,x=>alphabet[x%alphabet.length]).join('');
  const a:Access & {code:string}={id:nextId(),name:b.name,code:code.slice(0,5)+'-'+code.slice(5),code_hint:code.slice(-4),expires_at:new Date(Date.now()+b.duration_minutes*60000).toISOString(),revoked_at:null,allow_download:b.allow_download,presentations:s.presentations.filter(x=>b.presentation_ids.includes(x.id))};
  if(!a.presentations.length)throw new ApiError('Válassz legalább egy prezentációt.',422);s.accesses.unshift(a);save(s);return {access:a,code:a.code};
 }
 if(path.startsWith('/access-codes/')){const a=s.accesses.find(x=>x.id===id);if(!a)throw new ApiError('A hozzáférés nem található.',404);a.revoked_at=new Date().toISOString();save(s);return {};}
 if(!p)throw new ApiError('A prezentáció nem található.',404);
 if(path.endsWith('/file')||path.endsWith('/preview')){
  const preview=path.endsWith('/preview');
  if(method==='POST') {const file=(body as FormData).get('file') as File;if(!file.name.toLowerCase().endsWith('.pdf')||file.size>52428800)throw new ApiError('Legfeljebb 50 MB-os PDF-et válassz.',422);await putFile(p.id+'/preview',file);p.preview_size_bytes=file.size;p.status='ready';p.conversion_error=null;save(s);return p;}
  if(preview&&p.status!=='ready')throw new ApiError('Ehhez az anyaghoz még nincs PDF-változat.',404);
  const blob=await getFile(p.id+'/'+(preview&&p.extension!=='pdf'?'preview':'file'));
  if(blob)return blob;
  if(p.id<=3){const names=['uzleti-modell','fuggvenyek','digitalis-kultura'];return fetch('/assets/'+names[p.id-1]+'.pdf').then(r=>r.blob());}
  throw new ApiError('A fájl nem érhető el ebben a böngészőben.',404);
 }
 if(path.endsWith('/retry'))throw new ApiError('Az automatikus átalakítás a Laravel-szerveren fut. A demóhoz tölts fel PDF-változatot.',422);
 if(method==='DELETE'){await deleteFile(p.id+'/file');await deleteFile(p.id+'/preview');s.presentations=s.presentations.filter(x=>x.id!==id);s.accesses.forEach(a=>{a.presentations=a.presentations.filter(x=>x.id!==id);});save(s);return {};}
 if(method==='PATCH'){Object.assign(p,b);save(s);}return decorated(s,p);
}
function classroom(s:State,a:Access):Classroom{return {name:a.name,expires_at:a.expires_at,allow_download:a.allow_download,presentations:a.presentations.map(p=>s.presentations.find(x=>x.id===p.id)).filter((p):p is Presentation=>!!p).map(p=>decorated(s,p))};}
