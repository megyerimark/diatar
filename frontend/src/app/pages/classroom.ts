import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Classroom, Presentation, bytes } from '../core/models';
import { Icon } from '../shared/icon';
@Component({standalone:true,imports:[FormsModule,CommonModule,RouterLink,Icon],templateUrl:'./classroom.html'})
export class ClassroomPage implements OnInit,OnDestroy {
 api=inject(ApiService);toast=inject(ToastService);session=signal<Classroom|null>(null);busy=signal(false);error=signal('');code='';remaining=signal('');bytes=bytes;timer:any;
 async ngOnInit(){try{this.session.set(await this.api.classroom());this.tick();}catch{}this.timer=setInterval(()=>void this.check(),30000);}
 ngOnDestroy(){clearInterval(this.timer);}
 tick(){const s=this.session();if(!s)return;const minutes=Math.max(0,Math.ceil((Date.parse(s.expires_at)-Date.now())/60000));this.remaining.set(minutes>=60?Math.floor(minutes/60)+' óra '+minutes%60+' perc':minutes+' perc');if(!minutes){this.session.set(null);this.error.set('A hozzáférés lejárt. Kérj új kódot.');}}
 async check(){if(!this.session())return;try{this.session.set(await this.api.classroom());this.tick();}catch(e){this.session.set(null);this.error.set(e instanceof Error?e.message:'A hozzáférés megszűnt.');}}
 async enter(){this.error.set('');this.busy.set(true);try{this.session.set(await this.api.enter(this.code));this.code='';this.tick();}catch(e){this.error.set(e instanceof Error?e.message:'Nem sikerült megnyitni.');}finally{this.busy.set(false);}}
 async leave(){this.busy.set(true);try{await this.api.request('/classroom/leave','POST');this.session.set(null);this.toast.show('A tantermi hozzáférés lezárva.');}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
 async download(p:Presentation){try{await this.api.download(p,true);this.toast.show('A letöltés elindult.');}catch(e){this.toast.error(e);}}
}
