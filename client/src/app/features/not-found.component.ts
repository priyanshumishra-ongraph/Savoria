import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-card">
        <div class="error-code">404</div>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <a routerLink="/dashboard" class="home-btn">Go to Dashboard</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 70px);
      background-color: #faf5eb;
      font-family: 'Segoe UI', sans-serif;
    }
    .not-found-card {
      text-align: center;
      padding: 60px 40px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      max-width: 420px;
      width: 100%;
    }
    .error-code {
      font-size: 96px;
      font-weight: 800;
      line-height: 1;
      background: linear-gradient(135deg, #f97316, #ea580c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 16px;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 26px;
      color: #1a202c;
    }
    p {
      color: #718096;
      margin: 0 0 32px;
    }
    .home-btn {
      display: inline-block;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      transition: opacity 0.2s;
    }
    .home-btn:hover { opacity: 0.9; }
  `]
})
export class NotFoundComponent {}
