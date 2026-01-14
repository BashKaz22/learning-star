import type { FileType, SourcePointer, ExtractedContent, ContentChunk } from '@/types';

export interface ParsedSegment {
  pointer: SourcePointer;
  text: string;
}

export interface ParseResult {
  plainText: string;
  segments: ParsedSegment[];
  metadata?: Record<string, unknown>;
}

export interface ChunkingOptions {
  maxTokens: number;
  overlapTokens: number;
  preserveSentences: boolean;
}

export interface ChunkResult {
  content: string;
  pointerStart: SourcePointer;
  pointerEnd?: SourcePointer;
  tokenCount: number;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  tokenCount: number;
}

export interface IngestionPipelineResult {
  resourceId: string;
  extractedContent: ExtractedContent;
  chunks: ContentChunk[];
  status: 'success' | 'partial' | 'failed';
  errors?: string[];
}

export interface FileParser {
  fileTypes: FileType[];
  parse(buffer: ArrayBuffer, filename: string, resourceId: string): Promise<ParseResult>;
}

export interface ChunkingStrategy {
  chunk(parseResult: ParseResult, options: ChunkingOptions): ChunkResult[];
}

export interface EmbeddingProvider {
  embed(texts: string[]): Promise<EmbeddingResult[]>;
  modelName: string;
  dimensions: number;
}
