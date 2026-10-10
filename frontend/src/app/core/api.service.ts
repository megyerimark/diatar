import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { User, Presentation, Folder, Access, Classroom, ApiError } from './models';
import { demoRequest } from './demo';
@Injectable({providedIn:'root'})
export class ApiService {
 readonly demo=environment.demo;
 user=signal<User|null>(null);
 private csrfReady=false;
 async request<T>(path:string,method='GET',body?:unknown,retry=true):Promise<T>{
  if(this.demo)return demoRequest(path,method,body);
  if(method!=='GET'&&!this.csrfReady){await this.request('/csrf');this.csrfReady=true;}
  const headers:Record<string,string>={Accept:'application/json'};
  const token=document.cookie.split('; ').find(x=>x.startsWith('XSRF-TOKEN='))?.split('=').slice(1).join('=');if(token)headers['X-XSRF-TOKEN']=decodeURIComponent(token);
  const form=body instanceof FormData;if(body&&!form)headers['Content-Type']='application/json';
  let res:Response;
  try{res=await fetch(environment.api+path,{method,credentials:'include',headers,body:body?form?body as FormData:JSON.stringify(body):undefined});}catch{throw new ApiError('A szerver nem érhető el. Ellenőrizd az internetkapcsolatot.',0);}
  if(res.status===419&&retry){this.csrfReady=false;return this.request<T>(path,method,body,false);}
  if(!res.ok){const data=await res.json().catch(()=>({}));const first=data.errors?Object.values(data.errors).flat()[0]:null;throw new ApiError(String(first||data.message||(res.status===401?'Jelentkezz be a tárhelyedhez.':'A kérés nem sikerült.')),res.status);}
  if(res.headers.get('content-type')?.includes('application/json'))return res.json();return await res.blob() as T;
 }
 async me(){const r=await this.request<{user:User}>('/auth/me');this.user.set(r.user);return r.user;}
 async login(email:string,password:string){const r=await this.request<{user:User}>('/auth/login','POST',{email,password});this.user.set(r.user);}
 async register(name:string,email:string,password:string,password_confirmation:string){const r=await this.request<{user:User}>('/auth/register','POST',{name,email,password,password_confirmation});this.user.set(r.user);}
 async logout(){await this.request('/auth/logout','POST');this.user.set(null);}
 presentations(){return this.request<Presentation[]>('/presentations');}
 folders(){return this.request<Folder[]>('/folders');}
 accesses(){return this.request<Access[]>('/access-codes');}
 classroom(){return this.request<Classroom>('/classroom');}
 enter(code:string){return this.request<Classroom>('/classroom/enter','POST',{code});}
 async download(p:Presentation,classroom=false){const blob=await this.request<Blob>((classroom?'/classroom':'')+'/presentations/'+p.id+'/file');const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=p.original_name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
