'use client';

import { FileImport } from './FileImport';

export interface EmptyStateProps {
  onFileSelected: (file: File) => void;
}

export const EmptyState = ({ onFileSelected }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center gap-8">
      <div className="space-y-4 max-w-2xl">
        <div className="inline-block">
          <svg
            className="w-20 h-20 text-[#00ff41]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold text-[#00ff41] text-glow-md tracking-widest">
          BINARY
        </h1>
        <p className="text-xl sm:text-2xl text-[#00ff41] text-glow">
          see video in 0 and 1
        </p>
        <p className="text-base sm:text-lg opacity-80 leading-relaxed max-w-lg mx-auto">
          Import a video. Watch it become 0 and 1. Drag a file below or browse
          your PC. Everything stays in your browser. No uploads. No server.
        </p>
      </div>

      <div className="w-full max-w-xl mt-4">
        <FileImport onFileSelected={onFileSelected} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left w-full max-w-2xl">
        <div className="bg-black border border-[#004400] rounded p-3">
          <p className="text-[#00ff41] font-semibold text-sm mb-1">DRAG &amp; DROP</p>
          <p className="text-xs opacity-60">Drop any video file onto the zone</p>
        </div>
        <div className="bg-black border border-[#004400] rounded p-3">
          <p className="text-[#00ff41] font-semibold text-sm mb-1">LOCAL ONLY</p>
          <p className="text-xs opacity-60">Never leaves your browser</p>
        </div>
        <div className="bg-black border border-[#004400] rounded p-3">
          <p className="text-[#00ff41] font-semibold text-sm mb-1">LIVE RENDER</p>
          <p className="text-xs opacity-60">Real-time binary grid</p>
        </div>
      </div>
    </div>
  );
};
