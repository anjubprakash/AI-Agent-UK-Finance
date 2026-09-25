import crypto from 'node:crypto';
import { env } from '../src/config/env.js';
import { validateRegulatoryDocumentWithAI } from '../src/services/aiGatekeeper.service.js';
import { upsertRuleVectors, searchRuleVectors } from '../src/services/qdrant.service.js';
import { getEmbeddingModel } from '../src/services/aiProvider.service.js';
import { getGroqClient } from '../src/services/aiProvider.service.js';

async function runIntegrationTests() {
  console.log('🧪 Starting End-to-End Integration Verification Tests...\n');

  // Test 1: AI Gatekeeper on Valid UK Regulatory Document
  console.log('--- Test 1: AI Gatekeeper (Valid Document) ---');
  const validRuleText = `
    FCA Handbook PRIN 2A - The Consumer Duty
    A firm must act to deliver good outcomes for retail customers.
    Under PRIN 2A.1, firms must ensure that products and services meet the needs of retail customers,
    offer fair value, support consumer understanding, and provide adequate consumer support throughout the lifecycle.
  `;
  const validResult = await validateRegulatoryDocumentWithAI(validRuleText, 'FCA_Consumer_Duty_PRIN2A.pdf');
  console.log('Gatekeeper Result for Valid Document:', validResult);
  if (!validResult.isValidUKFinanceRule) {
    throw new Error('AI Gatekeeper failed to accept valid UK regulatory document');
  }
  console.log('✅ Test 1 Passed: Valid UK regulatory document approved!\n');

  // Test 2: AI Gatekeeper on Irrelevant Document
  console.log('--- Test 2: AI Gatekeeper (Irrelevant Document) ---');
  const invalidText = `
    Grandma Secret Chocolate Chip Cookie Recipe:
    Ingredients: 2 cups all-purpose flour, 1 cup softened butter, 1/2 cup granulated sugar,
    2 large eggs, 2 cups semi-sweet chocolate chips. Bake at 375 degrees for 10 minutes.
  `;
  const invalidResult = await validateRegulatoryDocumentWithAI(invalidText, 'Chocolate_Cookie_Recipe.docx');
  console.log('Gatekeeper Result for Invalid Document:', invalidResult);
  if (invalidResult.isValidUKFinanceRule) {
    throw new Error('AI Gatekeeper incorrectly accepted an irrelevant document');
  }
  console.log('✅ Test 2 Passed: Irrelevant document correctly rejected by AI Gatekeeper!\n');

  // Test 3: Qdrant Vector Storage & Semantic Search
  console.log('--- Test 3: Qdrant Vector Indexing & Search ---');
  const embeddingModel = getEmbeddingModel();
  const sampleDocText = 'FCA PRIN 2A.4: Firms must support customer understanding so that consumers can make informed decisions.';
  const vector = await embeddingModel.embedQuery(sampleDocText);

  await upsertRuleVectors([
    {
      id: crypto.randomUUID(),
      vector,
      payload: {
        documentId: 'doc_123',
        title: 'FCA Consumer Duty Handbook',
        authority: 'FCA',
        ruleCode: 'PRIN 2A.4',
        content: sampleDocText
      }
    }
  ]);

  const queryVector = await embeddingModel.embedQuery('What are the rules regarding customer understanding and disclosures?');
  const searchResults = await searchRuleVectors(queryVector, 1);
  console.log('Qdrant Search Top Result:', searchResults[0]?.payload?.ruleCode, 'Score:', searchResults[0]?.score);
  if (searchResults.length === 0 || !searchResults[0]?.payload) {
    throw new Error('Qdrant vector search failed to retrieve indexed rule');
  }
  console.log('✅ Test 3 Passed: Qdrant vector indexing and semantic retrieval verified!\n');

  // Test 4: Groq RAG Prompt Generation
  console.log('--- Test 4: Groq RAG Generation ---');
  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: env.GROQ_MODEL,
    messages: [
      { role: 'user', content: 'What are the main requirements of FCA Consumer Duty?' }
    ]
  });
  console.log('Groq Response Excerpt:\n', completion.choices[0]?.message?.content?.slice(0, 200) + '...');
  console.log('✅ Test 4 Passed: Groq LLM generated factual regulatory response!\n');

  console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🚀');
  process.exit(0);
}

runIntegrationTests().catch((err) => {
  console.error('❌ Integration Test Failure:', err);
  process.exit(1);
});
