import { HfInference } from '@huggingface/inference';
import { config } from '../config/index.js';
import { AIPlanBuilderService } from './aiPlanBuilderService.js';
import { AcademicKnowledgeEngine } from './academicKnowledgeEngine.js';
import { GeminiAIService } from './geminiAiService.js';
import { prisma } from '../db/prisma.js';

export const SYSTEM_STUDY_INSTRUCTION = `You are an intelligent study and programming assistant. Help students understand concepts, plan their studies, debug code, and learn independently. Give accurate, structured, practical answers. Explain reasoning at an educational level appropriate to the question. Ask for missing information when necessary. Do not invent syllabus content, exam dates, user data, test results, or execution results. Clearly distinguish verified information from assumptions. Never claim code was executed unless a real execution service confirmed it.`;

/**
 * High-Yield Academic Knowledge Base for educational fallbacks
 */
const CURRICULUM_KB = {
  binarySearch: {
    title: 'Binary Search Algorithm',
    concept: 'A divide-and-conquer search algorithm that finds the position of a target value within a sorted array in O(log n) logarithmic time by repeatedly dividing the search interval in half.',
    example: `\`\`\`python
def binary_search(arr, target):
    """Searches for target in a sorted list; returns index or -1."""
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

# Example usage:
numbers = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
print(binary_search(numbers, 23)) # Output: 5
\`\`\``
  },
  dsa: {
    title: 'Data Structures & Algorithms',
    concept: 'Fundamental computing constructs for organizing, storing, and manipulating data efficiently to solve computational problems with optimal time and space complexity.'
  },
  os: {
    title: 'Operating Systems & Virtual Memory',
    concept: 'System software managing computer hardware and software resources, providing memory abstraction (paging, segmentation), process scheduling, and file system isolation.'
  }
};

export class HuggingFaceAIService {
  static _client = null;

  /**
   * Lazily initializes HfInference client with configured token.
   */
  static getClient() {
    const token = config.huggingface?.token;
    if (!token) return null;
    if (!this._client) {
      this._client = new HfInference(token);
    }
    return this._client;
  }

  static isConfigured() {
    const token = config.huggingface?.token;
    return Boolean(token && token.trim() !== '' && !token.includes('your_token_here'));
  }

  static getModelId() {
    return config.huggingface?.modelId || 'Qwen/Qwen3-4B-Instruct-2507';
  }

  /**
   * Helper for bounded retry on transient provider errors (503, 504, network reset).
   */
  static async withRetry(fn, maxRetries = 2, delayMs = 1200) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();
        // Do not retry permanent auth errors or client bad requests
        if (msg.includes('unauthorized') || msg.includes('401') || msg.includes('403') || msg.includes('400')) {
          throw err;
        }
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
        }
      }
    }
    throw lastError;
  }

  /**
   * Cleans and sanitizes conversation history.
   * Restricts roles to 'user' and 'assistant', limits history length and message size.
   */
  static sanitizeHistory(history = [], maxHistoryLength = 16) {
    if (!Array.isArray(history)) return [];
    return history
      .filter((msg) => msg && typeof msg === 'object')
      .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
      .slice(-maxHistoryLength)
      .map((msg) => ({
        role: msg.role,
        content: String(msg.content || '').slice(0, 3000)
      }));
  }

  /**
   * Primary Chat Completion Endpoint handler
   */
  static async chat({ message, history = [], maxTokens = 600, temperature = 0.7 }) {
    if (!message || typeof message !== 'string' || message.trim() === '') {
      const err = new Error('Message is required and cannot be empty.');
      err.statusCode = 400;
      throw err;
    }

    if (message.length > 6000) {
      const err = new Error('Message length exceeds the maximum allowed limit of 6,000 characters.');
      err.statusCode = 400;
      throw err;
    }

    const modelId = this.getModelId();
    const cleanHistory = this.sanitizeHistory(history);

    // Tier 1: High-Speed Google Gemini 1.5 Flash (if API key provided)
    if (GeminiAIService.isConfigured()) {
      try {
        const geminiRes = await GeminiAIService.generateChat({
          message,
          history: cleanHistory,
          maxTokens,
          temperature
        });
        if (geminiRes?.answer) {
          return geminiRes;
        }
      } catch (geminiErr) {
        console.warn('Gemini inference failed, cascading to secondary provider:', geminiErr.message);
      }
    }

    const messages = [
      { role: 'system', content: SYSTEM_STUDY_INSTRUCTION },
      ...cleanHistory,
      { role: 'user', content: message.trim() }
    ];

    const hf = this.getClient();

    if (hf && this.isConfigured()) {
      try {
        const response = await this.withRetry(async () => {
          return await hf.chatCompletion({
            model: modelId,
            messages,
            max_tokens: maxTokens,
            temperature
          });
        });

        const answer = response.choices?.[0]?.message?.content?.trim();
        if (answer) {
          return {
            answer,
            model: modelId,
            provider: 'huggingface'
          };
        }
      } catch (err) {
        console.warn(`Hugging Face inference failed for ${modelId}:`, err.message);
        // If it was a 401/403 authorization error, inform the user cleanly
        if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
          return {
            answer: `Hugging Face Authentication Notice: The configured \`HF_TOKEN\` was rejected by the provider. Please verify your token permissions at https://huggingface.co/settings/tokens. \n\n${this.buildCurriculumAnswer(message)}`,
            model: modelId,
            provider: 'huggingface-auth-fallback'
          };
        }
        // Fall back gracefully to curriculum engine
      }
    }

    // High quality curriculum fallback when token is unconfigured or provider is offline
    const answer = this.buildCurriculumAnswer(message);
    return {
      answer,
      model: modelId,
      provider: 'academic-curriculum-engine',
      notice: !this.isConfigured()
        ? 'Live Qwen3 inference is ready. To connect remote Hugging Face API, set HF_TOKEN in your backend .env file.'
        : undefined
    };
  }

  /**
   * Chat Completion with Streaming (Server-Sent Events generator)
   */
  static async *streamChat({ message, history = [], maxTokens = 800, temperature = 0.7 }) {
    if (!message || message.trim() === '') {
      throw new Error('Message cannot be empty');
    }

    const modelId = this.getModelId();
    const cleanHistory = this.sanitizeHistory(history);

    // Tier 1: High-Speed Google Gemini 1.5 Flash (if API key provided)
    if (GeminiAIService.isConfigured()) {
      try {
        const geminiRes = await GeminiAIService.generateChat({
          message,
          history: cleanHistory,
          maxTokens,
          temperature
        });
        if (geminiRes?.answer) {
          const words = geminiRes.answer.split(' ');
          for (const word of words) {
            yield word + ' ';
            await new Promise((r) => setTimeout(r, 12));
          }
          return;
        }
      } catch (geminiErr) {
        console.warn('Gemini streaming inference failed, cascading to secondary provider:', geminiErr.message);
      }
    }

    const messages = [
      { role: 'system', content: SYSTEM_STUDY_INSTRUCTION },
      ...cleanHistory,
      { role: 'user', content: message.trim() }
    ];

    const hf = this.getClient();

    if (hf && this.isConfigured()) {
      try {
        const stream = await hf.chatCompletionStream({
          model: modelId,
          messages,
          max_tokens: maxTokens,
          temperature
        });

        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta;
          }
        }
        return;
      } catch (err) {
        console.warn('HF Streaming encountered an issue, falling back to progressive curriculum generator:', err.message);
      }
    }

    // Stream fallback tokens smoothly
    const fullText = this.buildCurriculumAnswer(message);
    const words = fullText.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const slice = words.slice(i, i + 3).join(' ') + ' ';
      yield slice;
      await new Promise((r) => setTimeout(r, 40));
    }
  }

  /**
   * Generates a context-aware study plan draft using Qwen3 and deterministic validation.
   */
  static async generateStudyPlanDraft({ userId, prompt, constraints = {}, history = [] }) {
    return AIPlanBuilderService.generatePlanDraft(userId, prompt, constraints, history);
  }

  /**
   * Code Explanation and Debugging Feature
   */
  static async explainCode({ code, language, error }) {
    if (!code) throw new Error('Code snippet is required.');

    const prompt = `Analyze this ${language || 'programming'} code and error message:\n\nCode:\n\`\`\`${language || ''}\n${code}\n\`\`\`\n\nError:\n${error || 'No error specified; review code logic.'}\n\nProvide:\n1. Root Cause Analysis\n2. Corrected Code Implementation\n3. Educational Takeaway and Prevention`;

    const res = await this.chat({ message: prompt });
    return res;
  }

  /**
   * Practice Questions Generator
   */
  static async generatePracticeQuestions({ topicTitle, subjectName, difficulty = 3, count = 3 }) {
    const prompt = `Generate ${count} educational multiple-choice assessment questions for the topic "${topicTitle}" in the subject "${subjectName || 'Computer Science'}" at difficulty level ${difficulty}/5. For each question, provide 4 options (A, B, C, D), the correct answer, and a textbook-standard explanation.`;

    const res = await this.chat({ message: prompt });
    return res;
  }

  /**
   * Revision Notes Generator
   */
  static async createRevisionNotes({ topicTitle, subjectName, material }) {
    const prompt = `Create a high-yield academic revision cheat sheet for "${topicTitle}" (${subjectName || 'Core Subject'}). Include:\n- Core definition and mathematical/algorithmic essence\n- Key components and terminology\n- Common examination questions and trade-offs\n- 3 quick active recall questions`;

    const res = await this.chat({ message: prompt });
    return res;
  }

  /**
   * Flashcard Deck Generator
   */
  static async generateFlashcards({ topicTitle, count = 3 }) {
    const prompt = `Create ${count} high-yield flashcard question and answer pairs for studying "${topicTitle}". Format clearly as:\nFront: [Question]\nBack: [Answer]`;

    const res = await this.chat({ message: prompt });
    return res;
  }

  /**
   * Next Steps Academic Recommendations
   */
  static async recommendNextSteps({ userId }) {
    const context = await AIPlanBuilderService.getStudentContext(userId);
    const weakNames = context.weakTopics?.map((t) => t.title).slice(0, 3) || [];
    const examNames = context.examinations?.map((e) => `${e.title} (in ${e.daysLeft}d)`).slice(0, 2) || [];

    const prompt = `Based on student profile: ${context.subjects.length} subjects, upcoming exams [${examNames.join(', ')}], and priority topics [${weakNames.join(', ')}], recommend the 3 most effective immediate study actions for today.`;

    const res = await this.chat({ message: prompt });
    return {
      recommendations: res.answer,
      contextSummary: {
        examCount: context.examinations.length,
        weakCount: context.weakTopics.length
      }
    };
  }

  /**
   * Dynamic high-yield academic & programming intelligence synthesis
   */
  static buildCurriculumAnswer(prompt, formatType = 'EXPLAIN', language = null) {
    return AcademicKnowledgeEngine.synthesize({
      prompt,
      formatType,
      language
    });
  }
}
