import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Icon } from '../shared/icon';
import { ApiService } from '../core/api.service';
import { ToastService } from '../core/toast.service';
@Component({standalone:true,imports:[RouterLink,Icon],templateUrl:'./landing.html'})
export class Landing {
 api=inject(ApiService);toast=inject(ToastService);router=inject(Router);busy=signal(false);
 async demo(){this.busy.set(true);try{await this.api.login('anna@example.com','demonstration');await this.router.navigateByUrl('/library');}catch(e){this.toast.error(e);}finally{this.busy.set(false);}}
}
