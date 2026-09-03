import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="onCancel()">
      <div class="modal-container" (click)="$event.stopPropagation()">
        <div class="modal-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-triangle"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <h3 class="modal-title">{{ title }}</h3>
        <p class="modal-message">{{ message }}</p>
        
        <div class="modal-actions">
          <button class="btn-cancel" (click)="onCancel()">{{ cancelText }}</button>
          <button class="btn-confirm" (click)="onConfirm()">{{ confirmText }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(26, 32, 44, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    .modal-container {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-icon {
      width: 48px;
      height: 48px;
      background: #fff5f5;
      color: #e53e3e;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    .modal-title {
      font-size: 20px;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 8px 0;
    }

    .modal-message {
      font-size: 15px;
      color: #4a5568;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
    }

    .btn-cancel, .btn-confirm {
      flex: 1;
      padding: 12px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-cancel {
      background: #edf2f7;
      color: #4a5568;
      border: none;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
      color: #1a202c;
    }

    .btn-confirm {
      background: #e53e3e;
      color: white;
      border: none;
      box-shadow: 0 4px 6px rgba(229, 62, 62, 0.2);
    }

    .btn-confirm:hover {
      background: #c53030;
      transform: translateY(-1px);
      box-shadow: 0 6px 8px rgba(229, 62, 62, 0.3);
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { 
      from { transform: translateY(20px) scale(0.95); opacity: 0; } 
      to { transform: translateY(0) scale(1); opacity: 1; } 
    }
  `]
})
export class ConfirmationModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
    this.isOpen = false;
  }

  onCancel() {
    this.cancel.emit();
    this.isOpen = false;
  }
}
