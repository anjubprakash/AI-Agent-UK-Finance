import fs from 'fs';
import { connectDB } from '../config/db.js';
import { RegulatoryDocument } from '../models/regulatoryDocument.model.js';
import { clearAllVectors } from '../services/qdrant.service.js';

const reset = async () => {
  console.log('🧹 Connecting to database to reset regulatory data...');
  await connectDB();

  const count = await RegulatoryDocument.countDocuments();
  console.log(`Found ${count} documents in MongoDB.`);

  // 1. Delete MongoDB documents
  await RegulatoryDocument.deleteMany({});
  console.log('✅ Cleared all documents from MongoDB.');

  // 2. Clear Qdrant vectors and local caches
  await clearAllVectors();
  console.log('✅ Cleared all points from Qdrant vector store and disk cache.');

  // 3. Clear uploads directory
  const uploadsDir = 'uploads';
  if (fs.existsSync(uploadsDir)) {
    try {
      const files = fs.readdirSync(uploadsDir);
      for (const f of files) {
        if (f !== '.gitkeep') {
          try { fs.unlinkSync(`${uploadsDir}/${f}`); } catch (_) {}
        }
      }
      console.log('✅ Cleared uploaded PDF/DOCX files.');
    } catch (_) {}
  }

  console.log('🎉 Reset complete! The knowledge base is now completely clean (0 documents, 0 vectors).');
  process.exit(0);
};

reset().catch((err) => {
  console.error('❌ Reset failed:', err.message);
  process.exit(1);
});
