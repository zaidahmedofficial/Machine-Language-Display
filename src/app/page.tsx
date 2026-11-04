'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useVideoBinaryEngine } from '../hooks/useVideoBinaryEngine';
import { Controls } from '../components/Controls';
import { EmptyState } from '../components/EmptyState';
import { FileImport } from '../components/FileImport';

const DEFAULT_COLS = 160;
const DEFAULT_THRESHOLD = 128;

export default function Home() {
  const [cols, setCols] = useState<number>(DEFAULT_COLS);
  const [threshold, setThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [inverted, setInverted] = useState<boolean>(false);
  const [showOriginal, setShowOriginal] = useState<boolean>(false);

  const engine = useVideoBinaryEngine({ cols, threshold, inverted });
  const { videoRef, canvasRef, state, acceptFile, loadVideo, play, pause, toggle, restart, reset } =
    engine;

  const originalHostRef = useRef<HTMLDivElement | null>(null);
  const [replaceOpen, setReplaceOpen] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileSelected = useCallback(
    (file: File) => {
      if (!acceptFile(file)) {
        setLocalError(
          `Unsupported file "${file.name}". Please choose a video file (${file.type || 'unknown type'}).`
        );
        return;
      }
      setLocalError(null);
      setReplaceOpen(false);
      loadVideo(file);
      // Autoplay once ready; the engine starts rendering as soon as the video
      // can play. A tiny delay lets the element mount.
      window.setTimeout(() => {
        videoRef.current?.play().catch(() => {
          /* autoplay may be blocked; user can press play */
        });
      }, 120);
    },
    [acceptFile, loadVideo, videoRef]
  );

  const displayError = localError ?? state.error;

  // Attach the live <video> element to the "show original" host when enabled.
  useEffect(() => {
    const host = originalHostRef.current;
    const video = videoRef.current;
    if (!host || !video) return;
    host.appendChild(video);
    return () => {
      if (video.parentNode === host) {
        host.removeChild(video);
      }
    };
  }, [showOriginal, videoRef, state.fileName, state.isReady]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.isReady) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      switch (event.code) {
        case 'Space':
          event.preventDefault();
          toggle();
          break;
        case 'KeyR':
          restart();
          break;
        case 'Escape':
          reset();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, restart, reset, state.isReady]);

  const loaded = state.isReady;

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#00ff41] text-glow-md tracking-widest">
            BINARY
          </h1>
          <p className="text-sm sm:text-base opacity-70">see video in 0 and 1</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs opacity-60 font-mono max-w-[280px]">
            <span className="text-[#00ff41] truncate">
              {state.fileName || 'no file loaded'}
            </span>
          </div>
          {loaded && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setReplaceOpen((value) => !value)}
              aria-expanded={replaceOpen}
            >
              IMPORT NEW
            </button>
          )}
        </div>
      </header>

      {displayError ? (
        <div
          className="border border-red-700 bg-red-950/30 rounded-lg p-4 mb-6"
          role="alert"
        >
          <p className="text-red-400 font-semibold mb-1">ERROR</p>
          <p className="text-sm">{displayError}</p>
        </div>
      ) : null}

      {loaded && replaceOpen ? (
        <div className="mb-6">
          <FileImport onFileSelected={handleFileSelected} />
        </div>
      ) : null}

      {loaded ? (
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 flex-1">
            <div
              className={`flex-1 grid gap-3 ${
                showOriginal ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              <div className="flex flex-col items-center justify-center bg-black border border-[#004400] rounded-lg p-2 sm:p-4 overflow-hidden min-h-[240px]">
                <p className="self-start text-[10px] font-mono tracking-widest opacity-50 mb-2">
                  0 / 1 RENDER
                </p>
                {state.isEnded ? (
                  <div className="text-center text-[#00ff41] text-glow py-10">
                    <p className="text-lg">END OF TRANSMISSION</p>
                    <button type="button" className="btn mt-4" onClick={restart}>
                      REPLAY
                    </button>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    id="binaryCanvas"
                    aria-label="Binary (0 and 1) rendering of the imported video"
                    className="block max-w-full"
                  />
                )}
              </div>

              {showOriginal ? (
                <div className="flex flex-col items-center justify-center bg-black border border-[#004400] rounded-lg p-2 sm:p-4 overflow-hidden min-h-[240px]">
                  <p className="self-start text-[10px] font-mono tracking-widest opacity-50 mb-2">
                    SOURCE VIDEO
                  </p>
                  <div
                    ref={originalHostRef}
                    className="flex items-center justify-center w-full"
                  />
                  {!state.videoWidth ? (
                    <p className="text-xs opacity-50 font-mono">DECODING...</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="w-full lg:w-80 flex flex-col gap-4">
              <Controls
                cols={cols}
                threshold={threshold}
                inverted={inverted}
                isPlaying={state.isPlaying}
                isReady={state.isReady}
                isEnded={state.isEnded}
                canPlay={state.isReady}
                onPlay={play}
                onPause={pause}
                onRestart={restart}
                onColsChange={setCols}
                onThresholdChange={setThreshold}
                onInvertChange={setInverted}
                onReset={reset}
                fps={state.fps}
                gridRows={state.gridRows}
              />

              <div className="bg-black border border-[#004400] rounded-lg p-4">
                <label
                  htmlFor="show-original"
                  className="flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span className="text-sm text-[#00ff41]">SHOW ORIGINAL</span>
                  <button
                    id="show-original"
                    type="button"
                    role="switch"
                    aria-checked={showOriginal}
                    className={`toggle ${showOriginal ? 'active' : ''}`}
                    onClick={() => setShowOriginal((value) => !value)}
                  >
                    <span className="sr-only">Toggle original video</span>
                  </button>
                </label>
              </div>

              <div className="bg-black border border-[#004400] rounded-lg p-4 space-y-2">
                <p className="text-[#00ff41] font-semibold text-sm">METADATA</p>
                <dl className="space-y-1 text-xs font-mono opacity-70">
                  <div className="flex justify-between gap-2">
                    <dt>FILE</dt>
                    <dd className="text-[#00ff41] text-right truncate max-w-[180px]">
                      {state.fileName}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>SIZE</dt>
                    <dd>{formatBytes(state.fileSizeBytes)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>FORMAT</dt>
                    <dd className="truncate max-w-[180px]">
                      {state.mimeType || 'unknown'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>RESOLUTION</dt>
                    <dd>
                      {state.videoWidth} x {state.videoHeight}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>DURATION</dt>
                    <dd>{formatTime(state.duration)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt>TIME</dt>
                    <dd>{formatTime(state.currentTime)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-black border border-[#004400] rounded-lg p-4">
                <p className="text-[#00ff41] font-semibold text-sm mb-2">KEYBOARD</p>
                <ul className="space-y-1 text-xs font-mono opacity-70">
                  <li>[SPACE] play / pause</li>
                  <li>[R] restart</li>
                  <li>[ESC] remove video</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState onFileSelected={handleFileSelected} />
      )}

      <footer className="mt-6 text-center text-xs opacity-40 font-mono">
        {loaded
          ? `BINARY RENDERER · ${cols} COLS · THR ${threshold} · ${
              inverted ? 'INV' : 'NRM'
            } · ${state.isPlaying ? 'PLAY' : 'PAUSE'} · ${state.fps.toFixed(1)} FPS`
          : 'BINARY RENDERER · READY · NO SIGNAL'}
      </footer>
    </div>
  );
}

function formatTime(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return '--:--';
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
