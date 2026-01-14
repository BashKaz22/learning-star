import type { ChunkingStrategy, ChunkingOptions, ChunkResult, ParseResult } from './types';
import type { SourcePointer } from '@/types';

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitIntoSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
}

export class SentenceChunker implements ChunkingStrategy {
  chunk(parseResult: ParseResult, options: ChunkingOptions): ChunkResult[] {
    const { maxTokens, overlapTokens } = options;
    const results: ChunkResult[] = [];

    for (const segment of parseResult.segments) {
      const sentences = splitIntoSentences(segment.text);
      let currentChunk: string[] = [];
      let currentTokens = 0;

      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const sentenceTokens = estimateTokenCount(sentence);

        if (currentTokens + sentenceTokens > maxTokens && currentChunk.length > 0) {
          const chunkText = currentChunk.join(' ');
          results.push({
            content: chunkText,
            pointerStart: segment.pointer,
            tokenCount: estimateTokenCount(chunkText),
          });

          const overlapSentences: string[] = [];
          let overlapCount = 0;
          for (let j = currentChunk.length - 1; j >= 0 && overlapCount < overlapTokens; j--) {
            overlapSentences.unshift(currentChunk[j]);
            overlapCount += estimateTokenCount(currentChunk[j]);
          }
          currentChunk = overlapSentences;
          currentTokens = overlapCount;
        }

        currentChunk.push(sentence);
        currentTokens += sentenceTokens;
      }

      if (currentChunk.length > 0) {
        const chunkText = currentChunk.join(' ');
        results.push({
          content: chunkText,
          pointerStart: segment.pointer,
          tokenCount: estimateTokenCount(chunkText),
        });
      }
    }

    return results;
  }
}

export class SimpleChunker implements ChunkingStrategy {
  chunk(parseResult: ParseResult, options: ChunkingOptions): ChunkResult[] {
    const { maxTokens, overlapTokens } = options;
    const results: ChunkResult[] = [];

    for (const segment of parseResult.segments) {
      const text = segment.text;
      const totalTokens = estimateTokenCount(text);

      if (totalTokens <= maxTokens) {
        results.push({
          content: text,
          pointerStart: segment.pointer,
          tokenCount: totalTokens,
        });
        continue;
      }

      const charsPerToken = text.length / totalTokens;
      const chunkSize = Math.floor(maxTokens * charsPerToken);
      const overlapSize = Math.floor(overlapTokens * charsPerToken);

      let start = 0;
      while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunkText = text.slice(start, end);

        results.push({
          content: chunkText,
          pointerStart: segment.pointer,
          tokenCount: estimateTokenCount(chunkText),
        });

        start = end - overlapSize;
        if (start >= text.length - overlapSize) break;
      }
    }

    return results;
  }
}

export function getDefaultChunker(): ChunkingStrategy {
  return new SentenceChunker();
}

export function getDefaultChunkingOptions(): ChunkingOptions {
  return {
    maxTokens: 512,
    overlapTokens: 50,
    preserveSentences: true,
  };
}
