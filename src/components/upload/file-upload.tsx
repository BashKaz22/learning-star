'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { FileType } from '@/types';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: FileType[];
  maxSizeMB?: number;
  multiple?: boolean;
  className?: string;
}

const FILE_TYPE_ACCEPT_MAP: Record<FileType, string> = {
  pdf: '.pdf,application/pdf',
  pptx: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  video: 'video/*',
  audio: 'audio/*',
  txt: '.txt,text/plain',
  md: '.md,text/markdown',
};

export function FileUpload({
  onFilesSelected,
  acceptedTypes = ['pdf', 'pptx', 'docx', 'video', 'audio'],
  maxSizeMB = 100,
  multiple = true,
  className,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const acceptString = acceptedTypes
    .map((type) => FILE_TYPE_ACCEPT_MAP[type])
    .join(',');

  const validateFiles = (files: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    for (const file of Array.from(files)) {
      if (file.size > maxSizeBytes) {
        setError(`File "${file.name}" exceeds ${maxSizeMB}MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    return validFiles;
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    setError(null);

    const files = validateFiles(e.dataTransfer.files);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const files = validateFiles(e.target.files);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div
      className={cn(
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
        isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
        className
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptString}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />

      <div className="space-y-4">
        <div className="text-4xl">📄</div>
        <div>
          <p className="text-lg font-medium">
            Drop files here or{' '}
            <Button variant="link" className="p-0 h-auto" onClick={handleClick}>
              browse
            </Button>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Supports PDF, PPTX, DOCX, video, and audio files up to {maxSizeMB}MB
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}
