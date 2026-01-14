import type { FileType } from '@/types';
import type { FileParser } from '../types';
import { PdfParser } from './pdf-parser';
import { TextParser } from './text-parser';

const parsers: FileParser[] = [
  new PdfParser(),
  new TextParser(),
];

export function getParser(fileType: FileType): FileParser | null {
  return parsers.find((p) => p.fileTypes.includes(fileType)) ?? null;
}

export { PdfParser, TextParser };
