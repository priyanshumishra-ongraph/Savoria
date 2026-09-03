import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './features/navbar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <app-navbar *ngIf="router.url !== '/login'" style="position: relative; z-index: 9999; display: block;"></app-navbar>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AppComponent {
  router = inject(Router);
}
