import { TestBed } from '@angular/core/testing';
import { SpeechService } from './speech.service';

describe('SpeechService', () => {
  let service: SpeechService;
  
  beforeEach(() => {
    // Mock window.speechSynthesis
    const mockSpeechSynthesis = {
      speak: () => { mockSpeechSynthesis.speakCalled = true; },
      cancel: () => { mockSpeechSynthesis.cancelCalled = true; },
      pause: () => { mockSpeechSynthesis.pauseCalled = true; },
      resume: () => { mockSpeechSynthesis.resumeCalled = true; },
      speaking: false,
      paused: false,
      speakCalled: false,
      cancelCalled: false,
      pauseCalled: false,
      resumeCalled: false
    };
    
    // Replace the global object safely
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, 'speechSynthesis', {
        value: mockSpeechSynthesis,
        writable: true
      });
      (window as any).SpeechSynthesisUtterance = class { constructor(public text: string) {} };
    }

    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeechService);
    
    // Inject the mock back into the service if needed
    (service as any).synth = mockSpeechSynthesis;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should cancel existing speech before speaking new text', () => {
    (service as any).synth.speaking = true;
    service.speak('Hello world');
    expect((service as any).synth.cancelCalled).toBe(true);
    expect((service as any).synth.speakCalled).toBe(true);
  });

  it('should pause speech', () => {
    (service as any).synth.speaking = true;
    (service as any).synth.paused = false;
    service.pause();
    expect((service as any).synth.pauseCalled).toBe(true);
  });

  it('should stop speech and listening', () => {
    let stopListeningCalled = false;
    service.stopListening = () => { stopListeningCalled = true; };
    service.stop();
    expect((service as any).synth.cancelCalled).toBe(true);
    expect(stopListeningCalled).toBe(true);
  });
});
