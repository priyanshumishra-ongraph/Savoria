/// <reference lib="webworker" />
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.useBrowserCache = false;

let embedder: any = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embedder;
}

function cosineSim(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

addEventListener('message', async ({ data }) => {
  const { type, payload } = data;

  if (type === 'EMBED_SINGLE') {
    const fe = await getEmbedder();
    const out = await fe(payload.text, { pooling: 'mean', normalize: true });
    postMessage({ type: 'EMBED_RESULT', vector: Array.from(out.data as Float32Array) });
  }

  if (type === 'RANK_SIMILAR') {
    const ranked = payload.candidates
      .map((c: { id: string; vec: number[] }) => ({
        id: c.id,
        score: cosineSim(payload.targetVec, c.vec),
      }))
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
      .slice(0, 6);
    postMessage({ type: 'RANK_RESULT', ranked });
  }
});
