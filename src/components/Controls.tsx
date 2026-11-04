'use client';

import { ChangeEvent, useCallback } from 'react';

export interface ControlsProps {
  cols: number;
  threshold: number;
  inverted: boolean;
  intensity: number;
  isPlaying: boolean;
  isReady: boolean;
  isEnded: boolean;
  canPlay: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onColsChange: (cols: number) => void;
  onThresholdChange: (threshold: number) => void;
  onInvertChange: (inverted: boolean) => void;
  onIntensityChange: (intensity: number) => void;
  onReset: () => void;
  fps: number;
  gridRows: number;
}

export const Controls = ({
  cols,
  threshold,
  inverted,
  intensity,
  isPlaying,
  isReady,
  isEnded,
  canPlay,
  onPlay,
  onPause,
  onRestart,
  onColsChange,
  onThresholdChange,
  onInvertChange,
  onIntensityChange,
  onReset,
  fps,
  gridRows,
}: ControlsProps) => {
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      onPause();
    } else if (isEnded) {
      onRestart();
    } else {
      onPlay();
    }
  }, [isPlaying, isEnded, onPause, onPlay, onRestart]);

  const handleCols = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onColsChange(Number(e.target.value));
  }, [onColsChange]);

  const handleThreshold = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onThresholdChange(Number(e.target.value));
  }, [onThresholdChange]);

  const handleInvert = useCallback(() => {
    onInvertChange(!inverted);
  }, [inverted, onInvertChange]);

  const handleIntensity = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onIntensityChange(Number(e.target.value)),
    [onIntensityChange]
  );

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  return (
    <div
      className="bg-black border border-[#004400] rounded-lg p-4"
      role="group"
      aria-label="Binary video controls"
    >
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button
          type="button"
          className="btn min-w-[72px]"
          onClick={handlePlay}
          disabled={!canPlay}
          aria-label={isPlaying ? 'Pause video' : 'Play video'}
        >
          {isPlaying ? 'PAUSE' : isEnded ? 'RESTART' : 'PLAY'}
        </button>
        <button
          type="button"
          className="btn min-w-[72px] btn-secondary"
          onClick={onRestart}
          disabled={!canPlay || isEnded}
          aria-label="Restart video from start"
        >
          RESTART
        </button>
        <button
          type="button"
          className="btn min-w-[72px] btn-secondary"
          onClick={handleReset}
          disabled={!canPlay}
          aria-label="Remove loaded video"
        >
          RESET
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="resolution" className="text-sm text-[#00ff41] opacity-90">
            RESOLUTION: {cols} COLS
          </label>
          <input
            id="resolution"
            type="range"
            min="40"
            max="320"
            step="8"
            value={cols}
            onChange={handleCols}
            disabled={!canPlay}
            aria-label="Binary grid resolution in columns"
            className="w-full"
          />
          <div className="flex justify-between text-xs opacity-60 font-mono">
            <span>40</span>
            <span>160</span>
            <span>320</span>
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="threshold" className="text-sm text-[#00ff41] opacity-90">
            THRESHOLD: {threshold}
          </label>
          <input
            id="threshold"
            type="range"
            min="0"
            max="255"
            value={threshold}
            onChange={handleThreshold}
            disabled={!canPlay}
            aria-label="Luminance threshold from 0 to 255"
            className="w-full"
          />
          <div className="flex justify-between text-xs opacity-60 font-mono">
            <span>0</span>
            <span>128</span>
            <span>255</span>
          </div>
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="intensity" className="text-sm text-[#00ff41] opacity-90">
            COLOR INTENSITY: {intensity}%
          </label>
          <input
            id="intensity"
            type="range"
            min="0"
            max="100"
            value={intensity}
            onChange={handleIntensity}
            disabled={!canPlay}
            aria-label="Color intensity from grayscale to full color"
            className="w-full"
          />
          <div className="flex justify-between text-xs opacity-60 font-mono">
            <span>GRAYSCALE</span>
            <span>50</span>
            <span>FULL COLOR</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-[#00ff41] opacity-90 whitespace-nowrap">
            INVERT 0/1
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={`toggle ${inverted ? 'active' : ''}`}
              onClick={handleInvert}
              disabled={!canPlay}
              role="switch"
              aria-checked={inverted}
              aria-label="Invert binary mapping (swap 0 and 1)"
            >
              <span className="sr-only">Invert binary</span>
            </button>
            <span className="text-xs font-mono opacity-70 min-w-[24px] text-center">
              {inverted ? '1 -> 0' : '0 -> 1'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono opacity-70">FPS</span>
          <span className="text-sm font-mono text-[#00ff41] text-glow">
            {fps.toFixed(1)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono opacity-70">GRID</span>
          <span className="text-sm font-mono text-[#00ff41] text-glow">
            {cols} x {gridRows}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono opacity-70">STATE</span>
          <span className="text-sm font-mono text-[#00ff41] text-glow">
            {isReady ? (isPlaying ? 'PLAYING' : 'PAUSED') : 'WAITING'}
          </span>
        </div>
      </div>
    </div>
  );
};
