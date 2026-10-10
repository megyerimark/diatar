import { Injectable, signal } from '@angular/core';
@Injectable({providedIn:'root'})
export class ToastService {
  items=signal<{id:number;text:string;error:boolean}[]>([]);
  show(text:string,error=false){ const id=Date.now()+Math.random();this.items.update(a=>[...a,{id,text,error}].slice(-4));setTimeout(()=>this.dismiss(id),5500); }
  dismiss(id:number){this.items.update(a=>a.filter(x=>x.id!==id));}
  error(e:unknown){this.show(e instanceof Error?e.message:'Valami nem sikerült. Próbáld újra.',true);}
}
