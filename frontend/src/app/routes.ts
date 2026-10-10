import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './core/api.service';
const ownerGuard=async()=>{const api=inject(ApiService),router=inject(Router);try{await api.me();return true;}catch{return router.parseUrl('/login');}};
export const routes:Routes=[
 {path:'',loadComponent:()=>import('./pages/landing').then(m=>m.Landing)},
 {path:'login',loadComponent:()=>import('./pages/auth').then(m=>m.AuthPage)},
 {path:'register',loadComponent:()=>import('./pages/auth').then(m=>m.AuthPage)},
 {path:'forgot-password',loadComponent:()=>import('./pages/auth').then(m=>m.AuthPage)},
 {path:'reset-password',loadComponent:()=>import('./pages/auth').then(m=>m.AuthPage)},
 {path:'library',canActivate:[ownerGuard],loadComponent:()=>import('./pages/workspace').then(m=>m.Workspace)},
 {path:'classroom',loadComponent:()=>import('./pages/classroom').then(m=>m.ClassroomPage)},
 {path:'present/:id',canActivate:[ownerGuard],loadComponent:()=>import('./pages/viewer').then(m=>m.Viewer)},
 {path:'classroom/present/:id',loadComponent:()=>import('./pages/viewer').then(m=>m.Viewer)},
 {path:'**',redirectTo:''}
];
