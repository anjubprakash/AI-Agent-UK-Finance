// Environmnet variables validate here 
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters').default('uk_finance_rules_checking_super_secret_jwt_key_2026'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),

  // Groq LLM
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),

  // Qdrant Vector Store
  QDRANT_URL: z.string().default('http://localhost:6333'),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION_NAME: z.string().default('uk_financial_rules'),

  // Embedding Model (all-minilm local free 384-dim ONNX)
  EMBEDDING_PROVIDER: z.string().default('all-minilm'),
  OPENAI_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional()
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Environment configuration error:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
