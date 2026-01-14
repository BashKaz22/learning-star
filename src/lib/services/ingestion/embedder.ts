import type { EmbeddingProvider, EmbeddingResult } from './types';

export class OpenAIEmbedder implements EmbeddingProvider {
  modelName = 'text-embedding-3-small';
  dimensions = 1536;

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? '';
  }

  async embed(texts: string[]): Promise<EmbeddingResult[]> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required for embeddings');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelName,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embedding failed: ${error}`);
    }

    const data = await response.json();

    return data.data.map((item: { embedding: number[]; index: number }) => ({
      embedding: item.embedding,
      model: this.modelName,
      tokenCount: Math.ceil(texts[item.index].length / 4),
    }));
  }
}

export class MockEmbedder implements EmbeddingProvider {
  modelName = 'mock-embedding';
  dimensions = 1536;

  async embed(texts: string[]): Promise<EmbeddingResult[]> {
    return texts.map((text) => ({
      embedding: Array(this.dimensions).fill(0).map(() => Math.random() * 2 - 1),
      model: this.modelName,
      tokenCount: Math.ceil(text.length / 4),
    }));
  }
}

export function getEmbedder(useMock = false): EmbeddingProvider {
  if (useMock || !process.env.OPENAI_API_KEY) {
    return new MockEmbedder();
  }
  return new OpenAIEmbedder();
}
