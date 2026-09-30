import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VoiceSearchService {
  private recognition: any = null;
  readonly transcript$ = new Subject<string>();
  readonly listening$  = new BehaviorSubject<boolean>(false);
  readonly error$      = new Subject<string>();

  get isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }

  start() {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { this.error$.next('Voice search not supported in this browser'); return; }
    this.recognition = new SR();
    this.recognition.lang = 'en-US';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    this.recognition.onstart  = () => this.listening$.next(true);
    this.recognition.onend    = () => this.listening$.next(false);
    this.recognition.onerror  = (e: any) => { this.error$.next(e.error); this.listening$.next(false); };
    this.recognition.onresult = (e: any) => this.transcript$.next(e.results[0][0].transcript);
    this.recognition.start();
  }

  stop() { this.recognition?.stop(); }
}
