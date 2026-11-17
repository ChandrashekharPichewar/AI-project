export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AI Knowledge Inbox API',
    version: '1.0.0',
    description:
      'Production-style minimal web API for content ingestion, chunking, semantic vector embeddings (text-embedding-004), and question answering powered by Google Gemini (gemini-1.5-flash), PostgreSQL (pgvector), Prisma, and Cheerio.',
    contact: {
      name: 'AI Knowledge Inbox',
    },
  },
  servers: [
    {
      url: '/',
      description: 'Current API Server',
    },
  ],
  tags: [
    { name: 'System', description: 'Health check and service status' },
    { name: 'Ingestion', description: 'Plain text and server-side URL content ingestion' },
    { name: 'Knowledge Items', description: 'Inspect and manage saved items and vector chunks' },
    { name: 'RAG Query', description: 'Semantic search and grounded question answering with citations' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Check API and Database Health',
        description: 'Returns server uptime, timestamp, and database connectivity status (PostgreSQL + pgvector vs memory fallback).',
        responses: {
          '200': {
            description: 'Service status information',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Check API Health (prefixed route)',
        responses: {
          '200': {
            description: 'Service status information',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse',
                },
              },
            },
          },
        },
      },
    },
    '/ingest': {
      post: {
        tags: ['Ingestion'],
        summary: 'Ingest Text Note or Web URL',
        description:
          'Ingests content. If type is "url", fetches page server-side with Cheerio, sanitizes HTML, extracts clean text. Then applies sliding-window chunking (~750 chars, 120-char overlap), generates 1536-d OpenAI embeddings, and indexes in pgvector.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/IngestRequest',
              },
              examples: {
                textNote: {
                  summary: 'Plain Text Note',
                  value: {
                    type: 'text',
                    title: 'RAG Architecture Overview',
                    content:
                      'Retrieval-Augmented Generation (RAG) grounds LLM responses in verifiable external data, reducing hallucinations and providing citations.',
                  },
                },
                webUrl: {
                  summary: 'Webpage URL',
                  value: {
                    type: 'url',
                    content: 'https://en.wikipedia.org/wiki/Retrieval-augmented_generation',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Content successfully ingested and vector-indexed',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/IngestResponse',
                },
              },
            },
          },
          '400': {
            description: 'Validation Error',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse',
                },
              },
            },
          },
          '422': {
            description: 'Scraping / Content Extraction Error',
          },
        },
      },
    },
    '/api/ingest': {
      post: {
        tags: ['Ingestion'],
        summary: 'Ingest Text Note or Web URL (prefixed route)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/IngestRequest',
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Content ingested',
          },
        },
      },
    },
    '/items': {
      get: {
        tags: ['Knowledge Items'],
        summary: 'List All Saved Knowledge Items',
        description: 'Retrieves all saved notes and URLs with metadata, creation timestamps, and total vector chunk counts.',
        responses: {
          '200': {
            description: 'List of saved items',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ItemsResponse',
                },
              },
            },
          },
        },
      },
    },
    '/api/items': {
      get: {
        tags: ['Knowledge Items'],
        summary: 'List All Saved Knowledge Items (prefixed route)',
        responses: {
          '200': {
            description: 'List of saved items',
          },
        },
      },
    },
    '/items/{id}': {
      delete: {
        tags: ['Knowledge Items'],
        summary: 'Delete Saved Item by ID',
        description: 'Deletes the item and cascades deletion to all associated vector chunks in pgvector.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID of the item to delete',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Item deleted',
          },
          '404': {
            description: 'Item not found',
          },
        },
      },
    },
    '/api/items/{id}': {
      delete: {
        tags: ['Knowledge Items'],
        summary: 'Delete Saved Item by ID (prefixed route)',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'Item deleted',
          },
        },
      },
    },
    '/query': {
      post: {
        tags: ['RAG Query'],
        summary: 'Ask Question Over Saved Knowledge (RAG)',
        description:
          'Generates query embedding, retrieves top-K nearest chunks via cosine distance (`<=>`) in pgvector, constructs a grounded context prompt, and generates a response via OpenAI GPT (`gpt-4o-mini`) with cited sources and similarity scores.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/QueryRequest',
              },
              example: {
                query: 'What are the key benefits of RAG in our saved notes?',
                topK: 4,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Synthesized grounded answer with source citations',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/QueryResponse',
                },
              },
            },
          },
          '400': {
            description: 'Invalid query parameter',
          },
        },
      },
    },
    '/api/query': {
      post: {
        tags: ['RAG Query'],
        summary: 'Ask Question Over Saved Knowledge (prefixed route)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/QueryRequest',
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'RAG answer with citations',
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          uptime: { type: 'number', example: 124.5 },
          timestamp: { type: 'string', format: 'date-time' },
          services: {
            type: 'object',
            properties: {
              database: { type: 'string', example: 'connected (postgresql + pgvector)' },
              llm: { type: 'string', example: 'openai enabled' },
            },
          },
          version: { type: 'string', example: '1.0.0' },
        },
      },
      IngestRequest: {
        type: 'object',
        required: ['type', 'content'],
        properties: {
          type: {
            type: 'string',
            enum: ['text', 'url'],
            description: 'Type of content to ingest',
          },
          content: {
            type: 'string',
            description: 'Plain text note or valid HTTP/HTTPS URL',
          },
          title: {
            type: 'string',
            description: 'Optional custom title (auto-generated if omitted)',
          },
        },
      },
      IngestResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
              type: { type: 'string', enum: ['TEXT', 'URL'] },
              url: { type: 'string', nullable: true },
              chunkCount: { type: 'integer', example: 3 },
              contentLength: { type: 'integer', example: 1420 },
              createdAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      ItemsResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          count: { type: 'integer', example: 2 },
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                type: { type: 'string', enum: ['TEXT', 'URL'] },
                title: { type: 'string', nullable: true },
                url: { type: 'string', nullable: true },
                rawContent: { type: 'string' },
                chunkCount: { type: 'integer' },
                createdAt: { type: 'string', format: 'date-time' },
                updatedAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      QueryRequest: {
        type: 'object',
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            minLength: 2,
            description: 'Natural language question to ask over saved knowledge',
          },
          topK: {
            type: 'integer',
            minimum: 1,
            maximum: 20,
            default: 4,
            description: 'Number of top similar vector chunks to retrieve',
          },
        },
      },
      QueryResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              answer: {
                type: 'string',
                description: 'Grounded answer synthesized by OpenAI GPT',
              },
              sources: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    itemId: { type: 'string' },
                    chunkIndex: { type: 'integer' },
                    title: { type: 'string' },
                    url: { type: 'string', nullable: true },
                    type: { type: 'string' },
                    snippet: { type: 'string' },
                    similarity: { type: 'number', example: 0.892 },
                  },
                },
              },
              metrics: {
                type: 'object',
                properties: {
                  retrievedChunks: { type: 'integer', example: 4 },
                  processingTimeMs: { type: 'integer', example: 340 },
                },
              },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              statusCode: { type: 'integer' },
              details: { type: 'object' },
            },
          },
        },
      },
    },
  },
};

/**
 * Generates standalone, self-contained Swagger UI HTML with CDN bundle
 */
export function getSwaggerHtml(): string {
  const specJson = JSON.stringify(openApiSpec);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AI Knowledge Inbox - Swagger API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z'/><path d='M6 6h10'/><path d='M6 10h10'/></svg>">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .topbar {
      display: none !important;
    }
    .custom-header {
      background: linear-gradient(135deg, #312e81 0%, #4f46e5 100%);
      color: white;
      padding: 20px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .custom-header h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .custom-header .badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .swagger-ui {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }
    .swagger-ui .info {
      margin: 20px 0;
    }
    .swagger-ui .info .title {
      font-size: 28px;
      color: #0f172a;
    }
    .swagger-ui .scheme-container {
      background: #f1f5f9;
      padding: 14px 20px;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="custom-header">
    <h1>
      <span>🧠 AI Knowledge Inbox API</span>
      <span class="badge">OpenAPI 3.0 / Swagger</span>
    </h1>
    <div style="font-size: 13px; opacity: 0.9;">
      Postgres + pgvector • Express • Prisma • Cheerio • OpenAI GPT
    </div>
  </div>

  <div id="swagger-ui"></div>

  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${specJson};
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        defaultModelsExpandDepth: 1,
        docExpansion: "list",
        filter: true
      });
    };
  </script>
</body>
</html>`;
}
