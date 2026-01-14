import type { FileType, Resource, ExtractedContent, ContentChunk } from '@/types';
import type { IngestionPipelineResult, ChunkResult } from './types';
import { getParser } from './parsers';
import { getDefaultChunker, getDefaultChunkingOptions } from './chunker';
import { getEmbedder } from './embedder';

export interface IngestionContext {
  resourceId: string;
  courseId: string;
  userId: string;
  fileType: FileType;
  filename: string;
}

export async function runIngestionPipeline(
  buffer: ArrayBuffer,
  context: IngestionContext,
  options?: { useMockEmbeddings?: boolean }
): Promise<IngestionPipelineResult> {
  const errors: string[] = [];
  const { resourceId, fileType, filename } = context;

  const parser = getParser(fileType);
  if (!parser) {
    return {
      resourceId,
      extractedContent: {
        id: crypto.randomUUID(),
        resourceId,
        plainText: '',
        segments: [],
        createdAt: new Date().toISOString(),
      },
      chunks: [],
      status: 'failed',
      errors: [`No parser available for file type: ${fileType}`],
    };
  }

  let parseResult;
  try {
    parseResult = await parser.parse(buffer, filename, resourceId);
  } catch (error) {
    return {
      resourceId,
      extractedContent: {
        id: crypto.randomUUID(),
        resourceId,
        plainText: '',
        segments: [],
        createdAt: new Date().toISOString(),
      },
      chunks: [],
      status: 'failed',
      errors: [`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }

  const extractedContent: ExtractedContent = {
    id: crypto.randomUUID(),
    resourceId,
    plainText: parseResult.plainText,
    segments: parseResult.segments,
    createdAt: new Date().toISOString(),
  };

  const chunker = getDefaultChunker();
  const chunkingOptions = getDefaultChunkingOptions();
  const chunkResults: ChunkResult[] = chunker.chunk(parseResult, chunkingOptions);

  if (chunkResults.length === 0) {
    return {
      resourceId,
      extractedContent,
      chunks: [],
      status: 'partial',
      errors: ['No chunks generated from content'],
    };
  }

  const embedder = getEmbedder(options?.useMockEmbeddings);
  let embeddingResults;
  try {
    embeddingResults = await embedder.embed(chunkResults.map((c) => c.content));
  } catch (error) {
    errors.push(`Embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    embeddingResults = chunkResults.map(() => ({
      embedding: [],
      model: 'none',
      tokenCount: 0,
    }));
  }

  const chunks: ContentChunk[] = chunkResults.map((chunk, i) => ({
    id: crypto.randomUUID(),
    resourceId,
    content: chunk.content,
    pointerStart: chunk.pointerStart,
    pointerEnd: chunk.pointerEnd,
    embeddingModel: embeddingResults[i]?.model ?? 'none',
    tokenCount: chunk.tokenCount,
    createdAt: new Date().toISOString(),
  }));

  return {
    resourceId,
    extractedContent,
    chunks,
    status: errors.length > 0 ? 'partial' : 'success',
    errors: errors.length > 0 ? errors : undefined,
  };
}
