import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app/app';
import { routes } from './app/routes';
bootstrapApplication(App,{providers:[provideZonelessChangeDetection(),provideRouter(routes,withInMemoryScrolling({scrollPositionRestoration:'enabled'}))]}).catch(console.error);
