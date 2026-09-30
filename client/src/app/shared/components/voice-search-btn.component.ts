import { Component, EventEmitter, Output, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, NgIf } from '@angular/common';
import { VoiceSearchService } from '../../core/services/voice-search.service';

@Component({
  selector: 'app-voice-search-btn',
  standalone: true,
  imports: [MatIconModule, NgIf, AsyncPipe],
  template: `
    <button class="voice-btn" [class.listening]="voice.listening$ | async"
            [attr.aria-label]="(voice.listening$ | async) ? 'Stop' : 'Voice search'"
            [disabled]="!voice.isSupported"
            (click)="toggle()">
      <mat-icon>{{ (voice.listening$ | async) ? 'mic' : 'mic_none' }}</mat-icon>
      <span class="ripple" *ngIf="voice.listening$ | async"></span>
    </button>
  `,
  styles: [`
    .voice-btn { border: none; background: transparent; width: 44px; height: 44px;
      border-radius: 50%; cursor: pointer; display: flex; align-items: center;
      justify-content: center; position: relative; transition: background 0.2s; }
    .voice-btn:hover { background: rgba(234,88,12,0.1); }
    .voice-btn.listening mat-icon { color: #ea580c; }
    .ripple { position: absolute; inset: 0; border-radius: 50%;
      border: 2px solid #ea580c; animation: pulse 1s infinite; }
    @keyframes pulse {
      0%,100% { transform: scale(1); opacity: 1; }
      50%     { transform: scale(1.5); opacity: 0; }
    }
  `]
})
export class VoiceSearchBtnComponent {
  @Output() result = new EventEmitter<string>();
  public voice = inject(VoiceSearchService);

  constructor() {
    this.voice.transcript$.subscribe(t => this.result.emit(t));
  }

  toggle() {
    if (this.voice.listening$.value) this.voice.stop();
    else this.voice.start();
  }
}
