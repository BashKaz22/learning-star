import type { FileParser, ParseResult, ParsedSegment } from '../types';
import type { FileType, SourcePointer } from '@/types';

export class TextParser implements FileParser {
  fileTypes: FileType[] = ['txt', 'md'];

  async parse(buffer: ArrayBuffer, filename: string, resourceId: string): Promise<ParseResult> {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(buffer);

    const pointer: SourcePointer = {
      resourceId,
      fileType: filename.endsWith('.md') ? 'md' : 'txt',
      pageNumber: 1,
    };

    const segments: ParsedSegment[] = [{
      pointer,
      text,
    }];

    return {
      plainText: text,
      segments,
      metadata: {
        filename,
        charCount: text.length,
      },
    };
  }
}
