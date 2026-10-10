import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Icon } from '../shared/icon';
@Component({standalone:true,imports:[FormsModule,RouterLink,Icon],templateUrl:'./auth.html'})
export class AuthPage {
 api=inject(ApiService);toast=inject(ToastService);router=inject(Router);route=inject(ActivatedRoute);
 mode=this.route.snapshot.routeConfig?.path||'login';name='';email=this.route.snapshot.queryParamMap.get('email')||'';password='';confirm='';busy=signal(false);error=signal('');done=signal(false);
 get title(){return this.mode==='register'?'Legyen saját helyed.':this.mode==='forgot-password'?'Segítünk visszatérni.':this.mode==='reset-password'?'Egy új kezdet.':'Jó újra itt látni.';}
 async submit(){
  this.error.set('');if(['register','reset-password'].includes(this.mode)&&this.password!==this.confirm){this.error.set('A két jelszó nem egyezik.');return;}this.busy.set(true);
  try{
   if(this.mode==='register'){await this.api.register(this.name,this.email,this.password,this.confirm);await this.router.navigateByUrl('/library');}
   else if(this.mode==='login'){await this.api.login(this.email,this.password);await this.router.navigateByUrl('/library');}
   else if(this.mode==='forgot-password'){await this.api.request('/auth/forgot-password','POST',{email:this.email});this.done.set(true);}
   else{await this.api.request('/auth/reset-password','POST',{email:this.email,token:this.route.snapshot.queryParamMap.get('token'),password:this.password,password_confirmation:this.confirm});this.toast.show('A jelszavad megváltozott.');await this.router.navigateByUrl('/login');}
  }catch(e){this.error.set(e instanceof Error?e.message:'Nem sikerült.');}finally{this.busy.set(false);}
 }
 async demo(){this.busy.set(true);try{await this.api.login('anna@example.com','demonstration');await this.router.navigateByUrl('/library');}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
}
