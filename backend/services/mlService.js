import axios from 'axios';
import config from '../config/config.js';

/**
 * Communicates with the Flask ML Microservice to request intent classification.
 * 
 * @param {string} query - The customer query message text.
 * @returns {Promise<Object>} - The ML prediction object { intent, confidence, probabilities }
 */
export const getMLPrediction = async (query) => {
  try {
    const response = await axios.post(`${config.mlServiceUrl}/predict`, {
      query: query
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000 // 5 seconds timeout
    });

    return response.data;
  } catch (error) {
    console.error(`[ML Service Error] Failed to fetch prediction from ${config.mlServiceUrl}: ${error.message}`);
    
    // Return fallback result if ML service is unreachable
    return {
      intent: 'general_support',
      confidence: 0.0,
      probabilities: {},
      error: 'ML service temporary unavailable'
    };
  }
};

/**
 * Calls the Flask ML microservice for sentiment analysis.
 *
 * @param {string} query - The customer query message text.
 * @returns {Promise<Object>} - { label, score, is_negative }
 */
export const getSentimentAnalysis = async (query) => {
  try {
    const response = await axios.post(`${config.mlServiceUrl}/sentiment`, {
      query
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 8000
    });

    return response.data;
  } catch (error) {
    console.error(`[ML Service Error] Failed to fetch sentiment from ${config.mlServiceUrl}: ${error.message}`);

    return {
      label: 'UNKNOWN',
      score: 0,
      is_negative: false,
      error: 'Sentiment service temporarily unavailable'
    };
  }
};

export default {
  getMLPrediction,
  getSentimentAnalysis
};
