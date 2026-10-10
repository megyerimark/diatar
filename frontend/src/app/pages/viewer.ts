import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
import { Presentation } from '../core/models';
import { Icon } from '../shared/icon';
@Component({standalone:true,imports:[CommonModule,RouterLink,Icon],templateUrl:'./viewer.html'})
export class Viewer implements OnInit,AfterViewInit,OnDestroy {
 api=inject(ApiService);toast=inject(ToastService);route=inject(ActivatedRoute);router=inject(Router);
 @ViewChild('pdfCanvas') canvas!:ElementRef<HTMLCanvasElement>;
 @ViewChild('stage') stage!:ElementRef<HTMLElement>;
 item=signal<Presentation|null>(null);page=signal(1);total=signal(0);busy=signal(true);error=signal('');allowDownload=signal(true);classroom=this.router.url.startsWith('/classroom/');base=this.classroom?'/classroom':'';id=Number(this.route.snapshot.paramMap.get('id'));
 doc:any;task:any;timer:any;resize:any;observer?:ResizeObserver;destroyed=false;viewReady=false;renderId=0;
 keyboard=(e:KeyboardEvent)=>{if(e.target instanceof HTMLInputElement)return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();void this.go(1);}else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();void this.go(-1);}else if(e.key==='Home'){e.preventDefault();void this.goto(1);}else if(e.key==='End'){e.preventDefault();void this.goto(this.total());}};
 async ngOnInit(){
  try{
   const item=await this.api.request<Presentation>(this.base+'/presentations/'+this.id);this.item.set(item);
   if(this.classroom){const s=await this.api.classroom();this.allowDownload.set(s.allow_download);}
   const blob=await this.api.request<Blob>(this.base+'/presentations/'+this.id+'/preview');const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc='/assets/pdf.worker.min.mjs';
   this.doc=await pdfjs.getDocument({data:new Uint8Array(await blob.arrayBuffer()),isEvalSupported:false}).promise;
   if(this.destroyed){await this.doc.destroy();return;}this.total.set(this.doc.numPages);if(this.viewReady)await this.render();
  }catch(e){this.error.set(e instanceof Error?e.message:'A PDF nem nyitható meg.');this.busy.set(false);}
  this.timer=setInterval(()=>void this.validateAccess(),30000);document.addEventListener('keydown',this.keyboard);
 }
 ngAfterViewInit(){this.viewReady=true;this.observer=new ResizeObserver(()=>{clearTimeout(this.resize);this.resize=setTimeout(()=>void this.render(),150);});this.observer.observe(this.stage.nativeElement);if(this.doc)void this.render();}
 async validateAccess(){if(this.destroyed)return;try{if(this.classroom)await this.api.classroom();else await this.api.me();}catch(e){this.toast.error(e);await this.router.navigateByUrl(this.classroom?'/classroom':'/login');}}
 async render(){
  if(!this.doc||!this.canvas||this.destroyed)return;const rid=++this.renderId;this.busy.set(true);if(this.task){this.task.cancel();try{await this.task.promise;}catch{}}
  try{const p=await this.doc.getPage(this.page());if(rid!==this.renderId||this.destroyed)return;const base=p.getViewport({scale:1});const stage=this.stage.nativeElement;const scale=Math.min((stage.clientWidth-32)/base.width,(stage.clientHeight-32)/base.height);const ratio=Math.min(window.devicePixelRatio||1,2);const viewport=p.getViewport({scale:Math.max(.1,scale)});const c=this.canvas.nativeElement;c.width=Math.floor(viewport.width*ratio);c.height=Math.floor(viewport.height*ratio);c.style.width=viewport.width+'px';c.style.height=viewport.height+'px';this.task=p.render({canvasContext:c.getContext('2d')!,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});await this.task.promise;
  }catch(e:any){if(e.name!=='RenderingCancelledException'&&!this.destroyed)this.error.set('Ez a dia nem jeleníthető meg. Próbáld a letöltést.');}finally{if(rid===this.renderId)this.busy.set(false);}
 }
 async go(n:number){await this.goto(this.page()+n);}
 async goto(n:number){if(n<1||n>this.total()||this.destroyed)return;this.page.set(n);await this.render();}
 async full(){try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen();}catch{this.toast.show('A böngésző nem engedélyezte a teljes képernyőt.',true);}}
 async download(){const p=this.item();if(!p)return;try{await this.api.download(p,this.classroom);}catch(e){this.toast.error(e);}}
 ngOnDestroy(){this.destroyed=true;clearInterval(this.timer);clearTimeout(this.resize);this.observer?.disconnect();document.removeEventListener('keydown',this.keyboard);this.task?.cancel();void this.doc?.destroy();if(document.fullscreenElement)void document.exitFullscreen().catch(()=>{});}
}
