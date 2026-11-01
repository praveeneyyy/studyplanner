import { config } from '../config/index.js';
import { SYSTEM_STUDY_INSTRUCTION } from './huggingfaceAiService.js';

export class GeminiAIService {
  static getApiKey() {
    return (
      config.gemini?.apiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''
    ).trim();
  }

  static isConfigured() {
    const key = this.getApiKey();
    return Boolean(key && key !== '' && !key.includes('your_gemini_api_key'));
  }

  static async generateChat({ message, history = [], maxTokens = 800, temperature = 0.7 }) {
    if (!message || typeof message !== 'string') {
      throw new Error('Message is required.');
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('Gemini API key is not configured.');
    }

    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.8-flash',
      'gemini-2.5-flash',
      'gemini-flash-latest'
    ].filter(Boolean);

    const formattedContents = [];
    if (Array.isArray(history)) {
      for (const h of history) {
        if (!h || !h.content) continue;
        formattedContents.push({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(h.content).slice(0, 4000) }]
        });
      }
    }

    formattedContents.push({
      role: 'user',
      parts: [{ text: message.trim() }]
    });

    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_STUDY_INSTRUCTION }]
      },
      contents: formattedContents,
      generationConfig: {
        temperature: Number(temperature) || 0.7,
        maxOutputTokens: Number(maxTokens) || 800
      }
    };

    let lastError = null;
    for (const model of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errText = await res.text();
          // If model is not found on this endpoint, cascade to next candidate model
          if (res.status === 404 || errText.includes('NOT_FOUND')) {
            lastError = new Error(`Gemini ${model} not found: ${errText}`);
            continue;
          }
          throw new Error(`Gemini API error (${res.status}): ${errText}`);
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.map((p) => p.text).join('') || '';

        if (!text.trim()) {
          throw new Error('Gemini API returned an empty completion.');
        }

        return {
          answer: text.trim(),
          model,
          provider: 'google-gemini'
        };
      } catch (err) {
        lastError = err;
        if (!err.message?.includes('not found') && !err.message?.includes('404')) {
          throw err;
        }
      }
    }

    throw lastError || new Error('All candidate Gemini models failed.');
  }
}
