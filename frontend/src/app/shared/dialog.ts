import { Directive, ElementRef, EventEmitter, HostListener, OnDestroy, AfterViewInit, Output, inject } from '@angular/core';
@Directive({selector:'[appDialog]',standalone:true})
export class Dialog implements AfterViewInit,OnDestroy {
 private element:ElementRef<HTMLElement>=inject(ElementRef);
 private previous=document.activeElement as HTMLElement|null;
 @Output() closeDialog=new EventEmitter<void>();
 ngAfterViewInit(){queueMicrotask(()=>{const el=this.element.nativeElement;const first=el.querySelector<HTMLElement>('input:not([hidden]),select,button:not([disabled])');first?.focus();});}
 @HostListener('keydown',['$event']) key(event:KeyboardEvent){
  if(event.key==='Escape'){event.stopPropagation();this.closeDialog.emit();}
  if(event.key!=='Tab')return;
  const nodes=[...this.element.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([hidden]):not([disabled]),select:not([disabled]),[tabindex="0"]')].filter(e=>e.getClientRects().length>0);
  if(!nodes.length)return;
  const first=nodes[0],last=nodes[nodes.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
 ngOnDestroy(){this.previous?.focus();}
}
