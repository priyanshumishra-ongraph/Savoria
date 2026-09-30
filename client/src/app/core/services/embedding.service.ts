import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EmbeddingService {
  private worker!: Worker;
  private ready = false;

  init() {
    if (typeof Worker === 'undefined') return;
    this.worker = new Worker(
      new URL('../workers/embedding.worker', import.meta.url),
      { type: 'module' }
    );
    this.ready = true;
  }

  embedText(text: string): Promise<number[]> {
    if (!this.ready) return Promise.resolve([]);
    return new Promise(resolve => {
      const handler = ({ data }: MessageEvent) => {
        if (data.type === 'EMBED_RESULT') {
          this.worker.removeEventListener('message', handler);
          resolve(data.vector);
        }
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'EMBED_SINGLE', payload: { text } });
    });
  }

  rankSimilar(targetVec: number[], candidates: { id: string; vec: number[] }[]): Promise<{ id: string; score: number }[]> {
    if (!this.ready) return Promise.resolve([]);
    return new Promise(resolve => {
      const handler = ({ data }: MessageEvent) => {
        if (data.type === 'RANK_RESULT') {
          this.worker.removeEventListener('message', handler);
          resolve(data.ranked);
        }
      };
      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ type: 'RANK_SIMILAR', payload: { targetVec, candidates } });
    });
  }
}
