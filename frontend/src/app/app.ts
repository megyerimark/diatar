import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './core/toast.service';
import { Icon } from './shared/icon';
@Component({selector:'app-root',standalone:true,imports:[RouterOutlet,Icon],template:`<router-outlet/><div class="toasts" aria-live="polite">@for(t of toast.items();track t.id){<div class="toast" [class.error]="t.error"><app-icon [name]="t.error?'info':'check'"/><span>{{t.text}}</span><button (click)="toast.dismiss(t.id)" aria-label="Értesítés bezárása"><app-icon name="close"/></button></div>}</div>`})
export class App {toast=inject(ToastService);}
