import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Access, Folder, Presentation, bytes } from '../core/models';
import { Icon } from '../shared/icon';
import { Dialog } from '../shared/dialog';
@Component({standalone:true,imports:[FormsModule,CommonModule,RouterLink,Icon,Dialog],templateUrl:'./workspace.html'})
export class Workspace implements OnInit,OnDestroy {
 api=inject(ApiService);toast=inject(ToastService);router=inject(Router);
 tab=signal('library');folder=signal<number|null>(null);search=signal('');items=signal<Presentation[]>([]);folders=signal<Folder[]>([]);accesses=signal<Access[]>([]);loading=signal(true);busy=signal(false);selected=signal<Set<number>>(new Set());modal=signal('');files=signal<File[]>([]);drag=signal(false);newCode=signal('');newAccess=signal<Access|null>(null);loadError=signal('');mobileNav=signal(false);confirm=signal<{kind:string;id:number;name:string}|null>(null);
 title='';folderName='';folderColor='#c5cfae';uploadFolder='';editFolder='';shareName='';duration=120;allowDownload=true;editItem:Presentation|null=null;editFolderItem:Folder|null=null;profileName='';oldPassword='';newPassword='';passwordConfirm='';now=signal(Date.now());timer:any;
 bytes=bytes;
 visible=computed(()=>this.items().filter(p=>(this.folder()===null||p.folder_id===this.folder())&&p.title.toLocaleLowerCase('hu').includes(this.search().toLocaleLowerCase('hu'))));
 active=computed(()=>this.accesses().filter(a=>!a.revoked_at&&Date.parse(a.expires_at)>this.now()));
 heading=computed(()=>this.folder()===null?'Jó órát, '+this.firstName+'.':this.folders().find(f=>f.id===this.folder())?.name||'Prezentációk');
 clearSelection(){this.selected.set(new Set());}
 removeUpload(i:number){this.files.update(a=>a.filter((_,j)=>j!==i));}
 get firstName(){return this.api.user()?.name.split(' ').slice(-1)[0]||'Tanár';}
 get initials(){return this.api.user()?.name.split(' ').map(x=>x[0]).slice(0,2).join('')||'D';}
 get usage(){const u=this.api.user();return u?Math.min(100,u.used_bytes/u.storage_limit_bytes*100):0;}
 async ngOnInit(){this.profileName=this.api.user()?.name||'';await this.refresh();this.timer=setInterval(()=>{this.now.set(Date.now());if(this.items().some(p=>['pending','processing'].includes(p.status)))void this.refresh(true);},5000);}
 ngOnDestroy(){clearInterval(this.timer);}
 async refresh(silent=false){if(!silent)this.loading.set(true);this.loadError.set('');try{const [p,f,a]=await Promise.all([this.api.presentations(),this.api.folders(),this.api.accesses()]);this.items.set(p);this.folders.set(f);this.accesses.set(a);this.selected.update(s=>new Set([...s].filter(id=>p.some(x=>x.id===id))));await this.api.me();}catch(e){this.loadError.set(e instanceof Error?e.message:'Nem sikerült betölteni.');}finally{this.loading.set(false);}}
 navigate(tab:string){this.tab.set(tab);this.mobileNav.set(false);}
 chooseFolder(id:number|null){this.folder.set(id);this.tab.set('library');this.mobileNav.set(false);}
 toggle(id:number){this.selected.update(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});}
 openUpload(){this.files.set([]);this.uploadFolder=String(this.folder()||'');this.modal.set('upload');}
 addFiles(list:FileList|null){if(!list)return;const files=Array.from(list);const valid=files.filter(f=>/\.(pdf|pptx)$/i.test(f.name)&&f.size<=52428800);if(valid.length!==files.length)this.toast.show('PDF vagy PPTX fájlt válassz, legfeljebb 50 MB méretben.',true);this.files.update(a=>[...a,...valid].slice(0,20));}
 drop(e:DragEvent){e.preventDefault();this.drag.set(false);this.addFiles(e.dataTransfer?.files||null);}
 async upload(){this.busy.set(true);let ok=0;try{for(const f of this.files()){const b=new FormData();b.append('file',f);if(this.uploadFolder)b.append('folder_id',this.uploadFolder);await this.api.request('/presentations','POST',b);ok++;}this.modal.set('');this.toast.show(`${ok} prezentáció feltöltve.`);}catch(e){this.toast.error(e);this.files.update(a=>a.slice(ok));}finally{this.busy.set(false);await this.refresh(true);}}
 openFolder(f?:Folder){this.editFolderItem=f||null;this.folderName=f?.name||'';this.folderColor=f?.color||'#c5cfae';this.modal.set('folder');}
 async saveFolder(){this.busy.set(true);try{await this.api.request('/folders'+(this.editFolderItem?'/'+this.editFolderItem.id:''),this.editFolderItem?'PATCH':'POST',{name:this.folderName,color:this.folderColor});this.modal.set('');this.toast.show('A mappa elmentve.');await this.refresh(true);}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
 openEdit(p:Presentation){this.editItem=p;this.title=p.title;this.editFolder=String(p.folder_id||'');this.modal.set('edit');}
 async saveEdit(){if(!this.editItem)return;this.busy.set(true);try{await this.api.request('/presentations/'+this.editItem.id,'PATCH',{title:this.title,folder_id:Number(this.editFolder)||null});this.modal.set('');this.toast.show('A prezentáció elmentve.');await this.refresh(true);}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
 openShare(){if(!this.selected().size){this.toast.show('Válaszd ki az órára szánt prezentációkat.');return;}this.shareName='Órai prezentációk';this.duration=120;this.allowDownload=true;this.newCode.set('');this.modal.set('share');}
 async createCode(){this.busy.set(true);try{const r=await this.api.request<{access:Access;code:string}>('/access-codes','POST',{name:this.shareName,presentation_ids:[...this.selected()],duration_minutes:Number(this.duration),allow_download:this.allowDownload});this.newCode.set(r.code);this.newAccess.set(r.access);this.modal.set('code');this.toast.show('A tantermi kód elkészült.');await this.refresh(true);}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
 async copy(){try{await navigator.clipboard.writeText(this.newCode());this.toast.show('A kód a vágólapra került.');}catch{this.toast.show('Jelöld ki és másold ki a megjelenített kódot.',true);}}
 async download(p:Presentation){try{await this.api.download(p);this.toast.show('A letöltés elindult.');}catch(e){this.toast.error(e);}}
 ask(kind:string,id:number,name:string){this.confirm.set({kind,id,name});}
 async remove(){const c=this.confirm();if(!c)return;this.busy.set(true);try{const endpoint=c.kind==='presentation'?'presentations':c.kind==='folder'?'folders':'access-codes';await this.api.request('/'+endpoint+'/'+c.id,'DELETE');if(c.kind==='folder'&&this.folder()===c.id)this.folder.set(null);this.confirm.set(null);this.toast.show(c.kind==='access'?'A hozzáférés lezárva.':'Sikeresen törölve.');await this.refresh(true);}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
 async previewFile(e:Event){const file=(e.target as HTMLInputElement).files?.[0];if(!file||!this.editItem)return;this.busy.set(true);try{const b=new FormData();b.append('file',file);await this.api.request('/presentations/'+this.editItem.id+'/preview','POST',b);this.modal.set('');this.toast.show('A PDF-változat feltöltve.');await this.refresh(true);}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
 async retry(){if(!this.editItem)return;this.busy.set(true);try{await this.api.request('/presentations/'+this.editItem.id+'/retry','POST');this.modal.set('');this.toast.show('Az átalakítás újraindult.');await this.refresh(true);}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
 async saveProfile(){if(this.newPassword&&this.newPassword!==this.passwordConfirm){this.toast.show('A két új jelszó nem egyezik.',true);return;}this.busy.set(true);try{const r=await this.api.request<{user:any}>('/auth/profile','PATCH',{name:this.profileName,current_password:this.oldPassword||null,password:this.newPassword||null,password_confirmation:this.passwordConfirm||null});this.api.user.set(r.user);this.oldPassword='';this.newPassword='';this.passwordConfirm='';this.toast.show('A profilod elmentve.');}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
 async logout(){try{await this.api.logout();await this.router.navigateByUrl('/');}catch(e){this.toast.error(e);}}
 status(p:Presentation){return p.status==='ready'?'Vetíthető':p.status==='failed'?'PDF-változat szükséges':'PDF készül…';}
 accessStatus(a:Access){return a.revoked_at?'Lezárva':Date.parse(a.expires_at)<=this.now()?'Lejárt':'Aktív';}
}
