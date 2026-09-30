/// <reference lib="webworker" />
import { pipeline, env } from '@xenova/transformers';
import * as toxicity from '@tensorflow-models/toxicity';
import * as tf from '@tensorflow/tfjs';

env.allowLocalModels = false;
env.useBrowserCache = false;

let sentimentPipeline: any = null;
let toxicityModel: any = null;

addEventListener('message', async ({ data }) => {
  const { type, text } = data;

  if (type === 'INIT') {
    try {
      // Load the models
      postMessage({ type: 'STATUS', status: 'loading' });
      const threshold = 0.8;
      
      await tf.setBackend('cpu');
      await tf.ready();
      
      toxicityModel = await toxicity.load(threshold, []);
      
      sentimentPipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
      
      postMessage({ type: 'STATUS', status: 'ready' });
    } catch (error) {
      console.error('Error loading AI Models:', error);
      postMessage({ type: 'STATUS', status: 'error' });
    }
  }

  if (type === 'ANALYZE' && sentimentPipeline && toxicityModel && text) {
    try {
      const sentimentResult = await sentimentPipeline(text);
      const toxicityPredictions = await toxicityModel.classify([text]);
     
      let isToxic = false;
      toxicityPredictions.forEach((pred: any) => {
        if (pred.results[0].match === true) {
          isToxic = true;
        }
      });

      postMessage({ type: 'RESULT', result: sentimentResult[0], isToxic, text });
    } catch (error) {
      console.error('Error analyzing text:', error);
    }
  }
});
