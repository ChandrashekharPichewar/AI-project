import { chunkerService } from './services/chunker.service.js';
import { openAiService } from './services/openai.service.js';
import { vectorService } from './services/vector.service.js';
import { ragService } from './services/rag.service.js';
import { IngestSchema } from './schemas/ingest.schema.js';
import { QuerySchema } from './schemas/query.schema.js';

async function runE2E() {
  console.log('🧪 Starting Service & Architecture Verification Tests...\n');

  // 1. Schema Validation Tests
  console.log('--- 1. Testing Zod Validation Schemas ---');
  const validNote = IngestSchema.safeParse({
    type: 'text',
    content: 'Meeting notes on RAG architecture with pgvector.',
    title: 'Architecture Meeting',
  });
  console.log('Valid Note parsing success:', validNote.success);
  if (!validNote.success) throw new Error('Note validation failed');

  const invalidUrl = IngestSchema.safeParse({
    type: 'url',
    content: 'not-a-valid-url-format',
  });
  console.log('Invalid URL rejected properly:', !invalidUrl.success);
  if (invalidUrl.success) throw new Error('Invalid URL was incorrectly accepted');

  const validQuery = QuerySchema.safeParse({
    query: 'What did the note say about pgvector?',
    topK: 4,
  });
  console.log('Valid Query parsing success:', validQuery.success);
  if (!validQuery.success) throw new Error('Query validation failed');

  // 2. Chunker Service Tests
  console.log('\n--- 2. Testing Intentional Semantic Chunker ---');
  const sampleArticle = `
Retrieval-Augmented Generation (RAG) is an architecture that optimizes the output of large language models.
Instead of relying solely on parametric weights learned during pretraining, RAG references an authoritative external knowledge base.
PostgreSQL with the pgvector extension enables storing multi-dimensional embeddings alongside relational metadata.
This eliminates the complexity of synchronizing a standalone vector database with your primary relational database.
For chunking, sliding windows with sentence overlap ensure that semantic continuity is preserved across chunks.
This prevents entity boundary truncation and improves vector recall significantly.
`.trim();

  const chunks = chunkerService.chunkText(sampleArticle, {
    maxChunkSize: 200,
    overlap: 50,
  });
  console.log(`Generated ${chunks.length} chunks from sample article:`);
  chunks.forEach((c) => {
    console.log(`  [Chunk ${c.chunkIndex + 1}] (${c.content.length} chars): "${c.content.substring(0, 60)}..."`);
  });

  if (chunks.length < 2) {
    throw new Error('Chunker failed to split text into multiple chunks');
  }

  // 3. Vector Embeddings Generation Test
  console.log('\n--- 3. Testing Embedding Service ---');
  const chunkTexts = chunks.map((c) => c.content);
  const embeddings = await openAiService.generateEmbeddings(chunkTexts);
  console.log(`Generated embeddings count: ${embeddings.length}`);
  console.log(`Embedding dimensions: ${embeddings[0].length}`);
  if (embeddings.length !== chunks.length || embeddings[0].length === 0) {
    throw new Error('Embeddings shape mismatch');
  }

  // 4. Storing Ingested Item and Chunks in Vector Store
  console.log('\n--- 4. Testing Vector Storage & Item Ingestion ---');
  const stored = await vectorService.storeItemWithChunks(
    'TEXT',
    sampleArticle,
    'RAG & pgvector Best Practices',
    null,
    chunks,
    embeddings
  );
  console.log('Stored item ID:', stored.id, 'with chunk count:', stored.chunkCount);

  // 5. Query All Items
  console.log('\n--- 5. Testing getAllItems ---');
  const allItems = await vectorService.getAllItems();
  console.log(`Retrieved ${allItems.length} item(s) from store:`);
  console.log(`  Title: "${allItems[0].title}", Chunks: ${allItems[0].chunkCount}, Type: ${allItems[0].type}`);

  // 6. RAG Pipeline Execution (Query -> Embed -> Vector Cosine Search -> Answer Generation)
  console.log('\n--- 6. Testing Full RAG Pipeline ---');
  const question = 'Why should I use PostgreSQL with pgvector for RAG?';
  const ragResult = await ragService.executeRagQuery(question, 3);

  console.log(`Question: "${question}"`);
  console.log('Answer:\n', ragResult.answer);
  console.log('\nMetrics:', JSON.stringify(ragResult.metrics));
  console.log(`Cited Sources Count: ${ragResult.sources.length}`);
  ragResult.sources.forEach((s, idx) => {
    console.log(`  Source ${idx + 1}: "${s.title}" (Score: ${s.similarity})`);
    console.log(`    Snippet: "${s.snippet.substring(0, 80)}..."`);
  });

  if (ragResult.sources.length === 0) {
    throw new Error('RAG pipeline retrieved 0 sources for matching query');
  }

  // 7. Test Item Deletion
  console.log('\n--- 7. Testing Item Deletion ---');
  const deleted = await vectorService.deleteItem(stored.id);
  console.log('Item deleted successfully:', deleted);
  const afterDeleteItems = await vectorService.getAllItems();
  console.log(`Remaining items in store: ${afterDeleteItems.length}`);

  console.log('\n🎉 ALL ARCHITECTURE & PIPELINE TESTS PASSED 100%! 🎉\n');
}

runE2E().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
