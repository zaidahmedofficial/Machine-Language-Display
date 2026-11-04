'use client';

import { DragEvent, useCallback, useRef } from 'react';

export interface FileImportProps {
  onFileSelected: (file: File) => void;
}

export const FileImport = ({ onFileSelected }: FileImportProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onFileSelected(file);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    },
    [onFileSelected]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelected(files[0]);
      }
    },
    [onFileSelected]
  );

  return (
    <div
      className="relative group"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
      role="button"
      aria-label="Import a video file by dropping it here or clicking"
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleClick();
        }
      }}
    >
      <div
        className="absolute inset-0 border-2 border-[#004400] rounded-lg group-hover:border-[#00ff41] group-focus:border-[#00ff41]"
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center justify-center p-12 gap-4">
        <svg
          className="w-16 h-16 text-[#00ff41]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0 0l-2 2m2-2l2 2m-6 4h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <div className="text-center">
          <p className="text-lg text-[#00ff41] font-semibold mb-2">
            IMPORT A VIDEO
          </p>
          <p className="text-sm opacity-70">
            Drag and drop or click to select a video from your PC
          </p>
        </div>
        <button type="button" className="btn mt-2" onClick={handleClick}>
          BROWSE FILES
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFile}
        aria-label="Video file input"
      />
    </div>
  );
};
