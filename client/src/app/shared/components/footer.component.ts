import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-content">
        <p>&copy; Savoria 2026</p>
        <p>Made by Priyanshu Mishra</p>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background-color: #7D4E00;
      padding: 1.5rem 0;
      text-align: center;
      margin-top: auto;
      border-top: 1px solid #4E342E;
      width: 100%;
    }
    .footer-content p {
      margin: 0.2rem 0;
      color: #F5F5F5; /* Off-white text for contrast */
      font-size: 0.9rem;
    }
  `]
})
export class FooterComponent {}
