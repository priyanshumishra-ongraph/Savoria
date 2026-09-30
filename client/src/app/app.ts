import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './features/navbar.component';
import { FooterComponent } from './shared/components/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-navbar *ngIf="router.url !== '/login' && router.url !== '/register'" style="position: relative; z-index: 9999; display: block;"></app-navbar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer *ngIf="router.url !== '/login' && router.url !== '/register'"></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
    }
  `]
})
export class AppComponent implements OnInit {
  router = inject(Router);
  
  private previousPath = '';

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Extract just the path without query params
      const currentPath = event.urlAfterRedirects.split('?')[0];
      
      // Only scroll to top if the actual path changed (not just query params/filters)
      if (currentPath !== this.previousPath) {
        window.scrollTo({ top: 0, left: 0 });
        this.previousPath = currentPath;
      }
    });
  }
}
