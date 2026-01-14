import type { FileParser, ParseResult, ParsedSegment } from '../types';
import type { FileType, SourcePointer } from '@/types';

export class PdfParser implements FileParser {
  fileTypes: FileType[] = ['pdf'];

  async parse(buffer: ArrayBuffer, filename: string, resourceId: string): Promise<ParseResult> {
    const segments: ParsedSegment[] = [];
    let plainText = '';

    try {
      const pdfjs = await import('pdfjs-dist');
      
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      const numPages = pdf.numPages;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item) => ('str' in item ? item.str : ''))
          .join(' ')
          .trim();

        if (pageText) {
          const pointer: SourcePointer = {
            resourceId,
            fileType: 'pdf',
            pageNumber: pageNum,
          };

          segments.push({
            pointer,
            text: pageText,
          });

          plainText += pageText + '\n\n';
        }
      }

      return {
        plainText: plainText.trim(),
        segments,
        metadata: {
          pageCount: numPages,
          filename,
        },
      };
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
