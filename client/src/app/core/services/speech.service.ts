import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpeechService {
  private synth = window.speechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private recognition: any = null;
  
  // Emits voice commands like 'next', 'previous', 'repeat'
  public commands$ = new Subject<'next' | 'previous' | 'repeat'>();

  constructor() {}

  public speak(text: string): void {
    if (this.synth.speaking) {
      this.synth.cancel();
    }
    
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    
    // Pause listening while speaking to prevent feedback loops
    this.currentUtterance.onstart = () => this.stopListening();
    this.currentUtterance.onend = () => this.startListening();
    
    this.synth.speak(this.currentUtterance);
  }

  public pause(): void {
    if (this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  public resume(): void {
    if (this.synth.paused) {
      this.synth.resume();
    }
  }

  public stop(): void {
    this.synth.cancel();
    this.stopListening();
  }

  public startListening(): void {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (!this.recognition) {
      this.recognition = new SR();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim().toLowerCase();
        
        if (transcript.includes('next')) {
          this.commands$.next('next');
        } else if (transcript.includes('previous') || transcript.includes('back')) {
          this.commands$.next('previous');
        } else if (transcript.includes('repeat')) {
          this.commands$.next('repeat');
        }
      };
      
      this.recognition.onerror = (e: any) => {
        console.warn('Voice command error:', e.error);
        if (e.error === 'not-allowed' || e.error === 'audio-capture') {
          this.stopListening();
        }
      };
      
      // Auto-restart if it dies (continuous mode can time out)
      this.recognition.onend = () => {
        if (!this.synth.speaking) {
          try { this.recognition.start(); } catch (e) {}
        }
      };
    }
    
    try { this.recognition.start(); } catch (e) {}
  }

  public stopListening(): void {
    if (this.recognition) {
      this.recognition.onend = null; // Prevent auto-restart
      this.recognition.stop();
    }
  }
}
