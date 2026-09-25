import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initQdrantCollection, initSemanticCacheCollection, getStoredVectorCount } from './services/qdrant.service.js';
import { RegulatoryDocument } from './models/regulatoryDocument.model.js';
import { indexRegulatoryDocument } from './services/vectorStore.service.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Initialize Qdrant Vector Collections (Rules + Semantic Cache)
  const isQdrantReady = await initQdrantCollection();
  if (isQdrantReady) {
    try {
      await initSemanticCacheCollection();
      const vectorCount = await getStoredVectorCount();
      console.log(`✅ Vector knowledge base active with ${vectorCount} indexed chunks in Qdrant.`);
    } catch (countErr) {
      console.warn('⚠️ Vector store count notice:', countErr.message);
    }
  } else {
    console.warn(`⚠️ Server started with Qdrant offline. To enable vector search and ingestion, start Docker Desktop and run the Qdrant container.`);
  }

  // Start HTTP Server
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`
🚀 UK Financial Rules Checking AI Agent Backend running!
🌐 Port: ${env.PORT}
📊 Environment: ${env.NODE_ENV}
📡 API Endpoint: http://localhost:${env.PORT}/api
    `);
  });

  // Configure socket timeouts for large regulatory document ingestion (up to 10 minutes)
  server.setTimeout(600000);
  server.keepAliveTimeout = 65000;

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

startServer();
