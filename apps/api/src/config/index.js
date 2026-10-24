import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_ai_smart_study_planner_jwt_key_2026_xyz',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  watsonx: {
    apiKey: process.env.WATSONX_APIKEY || '',
    projectId: process.env.WATSONX_PROJECT_ID || '',
    url: process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com'
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || ''
  },
  huggingface: {
    token: process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY || '',
    modelId: process.env.HF_MODEL_ID || process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen3-4B-Instruct-2507',
    inferenceUrl: process.env.HUGGINGFACE_API_URL || 'https://api-inference.huggingface.co/models'
  }
};
