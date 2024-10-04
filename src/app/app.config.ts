import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection, SecurityContext } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideMarkdown } from 'ngx-markdown';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
    ),
    importProvidersFrom(BrowserAnimationsModule),
    provideMarkdown(),
    { provide: SecurityContext, useValue: SecurityContext } 
  ]
};
