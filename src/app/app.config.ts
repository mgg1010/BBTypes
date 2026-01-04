import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadComponent: () => import('./app-dashboard.component').then(m => m.AppDashboardComponent) },
  { path: 'edit/:slug', loadComponent: () => import('./app-config.component').then(m => m.AppConfigComponent) },
  { path: ':slug', loadComponent: () => import('./app-runner.component').then(m => m.AppRunnerComponent) }
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
