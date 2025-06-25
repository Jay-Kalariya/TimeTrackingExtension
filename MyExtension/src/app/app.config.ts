import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { provideToastr } from 'ngx-toastr';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideAnimations(),     // Requireda
    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 2000,
      preventDuplicates: true
    }),
    provideHttpClient(
      withInterceptors([AuthInterceptor])  // ✅ pass the function
    )
  ]
};
