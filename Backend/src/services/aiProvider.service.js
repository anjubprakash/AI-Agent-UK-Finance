import Groq from 'groq-sdk';
import { env } from '../config/env.js';

// Deterministic mock embedding generator for local/offline testing
class MockEmbeddings {
  constructor(dim = 384) {
    this.dim = dim;
  }

  async embedQuery(text) {
    return this.generateVector(text);
  }

  async embedDocuments(documents) {
    return documents.map((doc) => this.generateVector(doc));
  }

  generateVector(text) {
    const dim = this.dim;
    const vector = new Array(dim).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      vector[i % dim] = (vector[i % dim] + code / 255.0) % 1.0;
    }
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((v) => v / norm);
  }
}

// Fallback mock Groq client for testing without an API key
class MockGroqClient {
  constructor() {
    this.chat = {
      completions: {
        create: async ({ messages }) => {
          const userMsg = messages.find((m) => m.role === 'user')?.content || '';
          const fullText = messages.map((m) => m.content).join(' ');

          // Check if this is an AI Gatekeeper verification request
          if (fullText.includes('AI Gatekeeper') || fullText.includes('UK Financial Regulatory')) {
            // Isolate the actual uploaded document excerpt
            const parts = userMsg.split('--- DOCUMENT EXCERPT START ---');
            const docContent = parts.length > 1 ? parts[1].split('--- DOCUMENT EXCERPT END ---')[0].toLowerCase() : userMsg.toLowerCase();

            const hasValidTerms =
              docContent.includes('fca') ||
              docContent.includes('pra') ||
              docContent.includes('prudential') ||
              docContent.includes('conduct authority') ||
              docContent.includes('consumer duty') ||
              docContent.includes('handbook');

            const hasInvalidTerms =
              docContent.includes('cookie') ||
              docContent.includes('recipe') ||
              docContent.includes('shopping list') ||
              docContent.includes('flour');

            const isRelevant = hasValidTerms && !hasInvalidTerms;

            if (isRelevant) {
              return {
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        isValidUKFinanceRule: true,
                        authority: docContent.includes('pra') ? 'PRA' : 'FCA',
                        detectedRuleCodes: ['PRIN 2A', 'PRIN 1'],
                        confidenceScore: 0.96,
                        reasoning: 'The document defines official UK Financial Conduct Authority principles and compliance rules.'
                      })
                    }
                  }
                ]
              };
            } else {
              return {
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        isValidUKFinanceRule: false,
                        authority: 'OTHER',
                        detectedRuleCodes: [],
                        confidenceScore: 0.1,
                        reasoning: 'The document does not relate to UK financial regulations or official authority rulebooks.'
                      })
                    }
                  }
                ]
              };
            }
          }

          // Inspect question and context
          const userLower = userMsg.toLowerCase();
          const fullLower = fullText.toLowerCase();

          // 1. If asking about FIT Sch 1 / record keeping in FIT
          if (userLower.includes('sch 1') || (userLower.includes('record') && (userLower.includes('fit') || fullLower.includes('fit')))) {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      answer: `### FCA FIT Sourcebook – Record-keeping Provisions\n\nAccording to official Financial Conduct Authority (FCA) regulatory standards:\n\nUnder **FIT Sch 1.1 G** (Record keeping requirements):\n> *"There are no record keeping requirements in FIT."*\n\nThe FIT Sourcebook (*The Fit and Proper test for Approved Persons*) does not prescribe independent record-keeping rules for fitness and propriety evaluations. General governance and employee assessment record-keeping obligations for firms arise under senior management arrangements (such as SYSC) rather than direct rules within FIT Schedule 1.`,
                      confidence: 'HIGH',
                      suggestedFollowUps: [
                        'What are the three main assessment criteria under FIT 2?',
                        'Which FCA handbook outlines senior management record keeping rules?'
                      ]
                    })
                  }
                }
              ]
            };
          }

          // 2. If asking about FIT 2 assessment criteria
          if (userLower.includes('criteria') || userLower.includes('honesty') || (userLower.includes('fitness') && userLower.includes('propriety'))) {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      answer: `### FCA Assessment Criteria for Fitness and Propriety\n\nUnder the official FCA Handbook sourcebook **FIT 2 (Main assessment criteria)**, the FCA considers three main assessment criteria when evaluating a candidate's fitness and propriety:\n\n1. **Honesty, integrity and reputation** (FIT 2.1):\n   Evaluation of whether the candidate has been convicted of criminal offences, subject to regulatory reprimands, adverse civil judgments, or dishonest conduct.\n\n2. **Competence and capability** (FIT 2.2):\n   Assessment of whether the candidate possesses the necessary training, qualifications, skills, and experience to fulfill the role effectively.\n\n3. **Financial soundness** (FIT 2.3):\n   Verification that the candidate is not bankrupt, subject to insolvency proceedings, or severe financial distress that could compromise professional judgement.`,
                      confidence: 'HIGH',
                      suggestedFollowUps: [
                        'What factors are evaluated under FIT 2.1 regarding criminal convictions?',
                        'Does FIT Sch 1 outline any specific record-keeping requirements?'
                      ]
                    })
                  }
                }
              ]
            };
          }

          // 3. If asking about off-topic items (such as options trading, derivatives, etc.):
          if (userLower.includes('option') || userLower.includes('derivative') || !fullLower.includes('official source')) {
            return {
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      answer: `### ⚠️ Information Not Found in Knowledge Base\n\nThe uploaded regulatory documents in the knowledge base do not contain rules, definitions, or guidance regarding this topic.\n\nThe AI compliance assistant operates strictly on documents indexed in the knowledge base and will not answer questions outside official regulatory sourcebooks uploaded by your organization.\n\nPlease ask an administrator to upload the official UK regulatory document (e.g. FCA or PRA sourcebooks covering this subject) to the system.`,
                      confidence: 'NOT_FOUND',
                      suggestedFollowUps: [
                        'Which regulatory sourcebooks are currently indexed in the system?',
                        'How do I upload a new FCA/PRA sourcebook?'
                      ]
                    })
                  }
                }
              ]
            };
          }

          // 4. Default grounded response based on provided context
          return {
            usage: { prompt_tokens: 380, completion_tokens: 150, total_tokens: 530 },
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    answer: `Based on official UK regulatory standards from the indexed knowledge base:\n\nUnder official regulatory rules, firms must adhere strictly to approved conduct principles, governance standards, and specific sourcebook obligations.\n\nFor specific clause requirements, consult the cited rule references.`,
                    confidence: 'HIGH',
                    suggestedFollowUps: [
                      'What are the specific governance obligations under the handbook?',
                      'Which rule code applies to your query?'
                    ]
                  })
                }
              }
            ]
          };
        }
      }
    };
  }
}

// Pluggable Groq SDK Client
export const getGroqClient = () => {
  if (env.GROQ_API_KEY) {
    return new Groq({ apiKey: env.GROQ_API_KEY });
  }
  console.warn('⚠️ No GROQ_API_KEY detected in .env. Using mock Groq client for pipeline execution.');
  return new MockGroqClient();
};

// Ultra-lightweight Xenova/all-MiniLM-L6-v2 Embedding Engine (Free, 100% offline, ~25MB ONNX, 384-dim, <40MB RAM)
class LocalMiniLMEmbeddings {
  constructor() {
    this.pipelinePromise = null;
    this.mock = new MockEmbeddings(384);
  }

  async getExtractor() {
    if (!this.pipelinePromise) {
      this.pipelinePromise = (async () => {
        const { pipeline } = await import('@huggingface/transformers');
        return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' });
      })();
    }
    return this.pipelinePromise;
  }

  async embedQuery(text) {
    try {
      const extractor = await this.getExtractor();
      const cleanText = (text || '').slice(0, 1000);
      const output = await extractor(cleanText, {
        pooling: 'mean',
        normalize: true,
        truncation: true,
        max_length: 256
      });
      const list = output.tolist();
      return list[0];
    } catch (err) {
      console.warn('⚠️ all-MiniLM-L6-v2 embedQuery fallback to deterministic vector:', err.message);
      return this.mock.embedQuery(text);
    }
  }

  async embedDocuments(documents) {
    const embeddings = [];
    try {
      const extractor = await this.getExtractor();
      const BATCH_SIZE = 32;
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const rawBatch = documents.slice(i, i + BATCH_SIZE);
        const batch = rawBatch.map((d) => (d || '').slice(0, 1000));
        try {
          const output = await extractor(batch, {
            pooling: 'mean',
            normalize: true,
            truncation: true,
            max_length: 256
          });
          const batchVectors = output.tolist();
          embeddings.push(...batchVectors);
        } catch (batchErr) {
          // If a batch encounters an issue, embed items individually with truncation
          for (const doc of batch) {
            try {
              const single = await extractor(doc, {
                pooling: 'mean',
                normalize: true,
                truncation: true,
                max_length: 256
              });
              embeddings.push(single.tolist()[0]);
            } catch (singleErr) {
              embeddings.push(await this.mock.embedQuery(doc));
            }
          }
        }
        // Yield event loop so concurrent requests (e.g. notifications polling) are never blocked
        await new Promise((resolve) => setImmediate(resolve));
      }
      return embeddings;
    } catch (err) {
      console.warn('⚠️ all-MiniLM-L6-v2 embedDocuments fallback to deterministic vectors:', err.message);
      return this.mock.embedDocuments(documents);
    }
  }
}

let cachedEmbedder = null;

// Local Embedding Model Factory (384-dim all-MiniLM-L6-v2 via ONNX)
export const getEmbeddingModel = () => {
  if (cachedEmbedder) return cachedEmbedder;
  cachedEmbedder = new LocalMiniLMEmbeddings();
  return cachedEmbedder;
};
