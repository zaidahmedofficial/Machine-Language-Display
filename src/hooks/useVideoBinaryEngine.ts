'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const MONO_FONT = '"Courier New", Consolas, Monaco, "Cascadia Mono", monospace';

const TARGET_CANVAS_WIDTH = 1280;
const MIN_CHAR_HEIGHT = 8;
const MAX_CHAR_HEIGHT = 34;

/** Minimum channel brightness so a dark pixel's glyph never disappears on black. */
const MIN_CHAR_BRIGHTNESS = 28;

export interface EngineState {
  duration: number | null;
  currentTime: number;
  isPlaying: boolean;
  isReady: boolean;
  isEnded: boolean;
  error: string | null;
  fps: number;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  videoWidth: number;
  videoHeight: number;
  gridRows: number;
}

export interface UseVideoBinaryEngineProps {
  cols: number;
  threshold: number;
  inverted: boolean;
  /** 0 = grayscale, 100 = full original color. */
  intensity: number;
}

export interface UseVideoBinaryEngineResult {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: EngineState;
  acceptFile: (file: File) => boolean;
  loadVideo: (file: File) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  restart: () => void;
  reset: () => void;
}

export function useVideoBinaryEngine({
  cols,
  threshold,
  inverted,
  intensity,
}: UseVideoBinaryEngineProps): UseVideoBinaryEngineResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const colsRef = useRef<number>(cols);
  const thresholdRef = useRef<number>(threshold);
  const invertedRef = useRef<boolean>(inverted);
  const intensityRef = useRef<number>(intensity);

  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const rafIdRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  const fpsRef = useRef<number>(0);
  const lastFpsSampleRef = useRef<number>(0);
  const lastCanvasWRef = useRef<number>(0);
  const lastCanvasHRef = useRef<number>(0);
  const gridRowsRef = useRef<number>(0);
  const reportedRowsRef = useRef<number>(-1);
  const dirtyRef = useRef<boolean>(true);

  const [state, setState] = useState<EngineState>({
    duration: null,
    currentTime: 0,
    isPlaying: false,
    isReady: false,
    isEnded: false,
    error: null,
    fps: 0,
    fileName: '',
    fileSizeBytes: 0,
    mimeType: '',
    videoWidth: 0,
    videoHeight: 0,
    gridRows: 0,
  });

  useEffect(() => {
    colsRef.current = cols;
    dirtyRef.current = true;
  }, [cols]);

  useEffect(() => {
    thresholdRef.current = threshold;
    dirtyRef.current = true;
  }, [threshold]);

  useEffect(() => {
    invertedRef.current = inverted;
    dirtyRef.current = true;
  }, [inverted]);

  useEffect(() => {
    intensityRef.current = intensity;
    dirtyRef.current = true;
  }, [intensity]);

  const acceptFile = useCallback((file: File): boolean => {
    if (!file) return false;
    const type = file.type.toLowerCase().trim();
    if (type.length > 0 && !type.startsWith('video/')) {
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    if (!state.isReady) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const tick = (now: number) => {
      const video = videoRef.current;
      const currentCanvas = canvasRef.current;
      const currentCtx = currentCanvas?.getContext('2d', { alpha: false }) ?? null;

      if (video && currentCanvas && currentCtx && video.readyState >= 2 && video.videoWidth > 0) {
        const playing = !video.paused && !video.ended;

        // FPS sampling (only counts frames while actually playing).
        if (playing) {
          if (frameCountRef.current === 0) {
            lastFpsSampleRef.current = now;
          }
          frameCountRef.current += 1;
          if (now - lastFpsSampleRef.current >= 500) {
            fpsRef.current =
              Math.round(
                (frameCountRef.current / ((now - lastFpsSampleRef.current) / 1000)) * 10
              ) / 10;
            frameCountRef.current = 0;
            lastFpsSampleRef.current = now;
            setState((prev) =>
              prev.fps === fpsRef.current ? prev : { ...prev, fps: fpsRef.current }
            );
          }
        }

        // Only re-sample when the frame is moving or a control changed, so a
        // paused video does not burn CPU redrawing identical output.
        if (playing || dirtyRef.current) {
          dirtyRef.current = false;
          renderBinaryFrame(
            currentCanvas,
            currentCtx,
            video,
            colsRef.current,
            thresholdRef.current,
            intensityRef.current,
            invertedRef.current,
            scratchCanvasRef,
            lastCanvasWRef,
            lastCanvasHRef,
            gridRowsRef
          );

          if (gridRowsRef.current !== reportedRowsRef.current) {
            reportedRowsRef.current = gridRowsRef.current;
            const nextRows = gridRowsRef.current;
            setState((prev) =>
              prev.gridRows === nextRows ? prev : { ...prev, gridRows: nextRows }
            );
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [state.isReady]);

  const loadVideo = useCallback((file: File) => {
    // Tear down any previous video.
    const previous = videoRef.current;
    if (previous) {
      const oldSrc = previous.src;
      previous.pause();
      previous.removeAttribute('src');
      previous.load();
      if (oldSrc.startsWith('blob:')) {
        URL.revokeObjectURL(oldSrc);
      }
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    video.setAttribute('playsinline', 'true');
    video.style.display = 'block';
    video.style.width = '100%';
    video.style.height = 'auto';
    video.style.maxWidth = '100%';
    video.style.maxHeight = '70vh';
    video.style.objectFit = 'contain';
    video.style.border = '1px solid #004400';
    video.style.borderRadius = '4px';

    videoRef.current = video;

    const onLoadedMetadata = () => {
      setState((prev) => ({
        ...prev,
        duration: Number.isFinite(video.duration) ? video.duration : null,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
      }));
      lastCanvasWRef.current = 0;
      lastCanvasHRef.current = 0;
    };

    const onCanPlay = () => {
      dirtyRef.current = true;
      setState((prev) => ({ ...prev, isReady: true, error: null }));
    };

    const onSeeked = () => {
      dirtyRef.current = true;
    };

    const onTimeUpdate = () => {
      setState((prev) =>
        prev.currentTime === video.currentTime
          ? prev
          : { ...prev, currentTime: video.currentTime }
      );
    };

    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));

    const onEnded = () => setState((prev) => ({ ...prev, isEnded: true, isPlaying: false }));

    const onError = () => {
      const err = video.error;
      let message = 'Failed to decode this video file.';
      if (err) {
        switch (err.code) {
          case 1:
            message = 'Media load aborted before decoding.';
            break;
          case 2:
            message = 'A network error stopped the video.';
            break;
          case 3:
            message = 'This video format is not supported by your browser.';
            break;
          case 4:
            message = 'The media metadata could not be parsed.';
            break;
          default:
            message = `Video decode error (code ${err.code}).`;
        }
      }
      setState((prev) => ({ ...prev, isReady: false, error: message }));
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    setState({
      duration: null,
      currentTime: 0,
      isPlaying: false,
      isReady: false,
      isEnded: false,
      error: null,
      fps: 0,
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || 'video/mp4',
      videoWidth: 0,
      videoHeight: 0,
      gridRows: 0,
    });

    video.load();
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.ended) {
      video.currentTime = 0;
    }
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        setState((prev) => ({ ...prev, error: 'Playback was blocked by the browser.' }));
      });
    }
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      play();
    } else {
      pause();
    }
  }, [play, pause]);

  const restart = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    setState((prev) => ({ ...prev, isEnded: false }));
    play();
  }, [play]);

  const reset = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      const oldSrc = video.src;
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (oldSrc.startsWith('blob:')) {
        URL.revokeObjectURL(oldSrc);
      }
    }
    videoRef.current = null;
    lastCanvasWRef.current = 0;
    lastCanvasHRef.current = 0;
    gridRowsRef.current = 0;
    reportedRowsRef.current = -1;
    frameCountRef.current = 0;
    fpsRef.current = 0;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d', { alpha: false });
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    setState({
      duration: null,
      currentTime: 0,
      isPlaying: false,
      isReady: false,
      isEnded: false,
      error: null,
      fps: 0,
      fileName: '',
      fileSizeBytes: 0,
      mimeType: '',
      videoWidth: 0,
      videoHeight: 0,
      gridRows: 0,
    });
  }, []);

  return {
    videoRef,
    canvasRef,
    state,
    acceptFile,
    loadVideo,
    play,
    pause,
    toggle,
    restart,
    reset,
  };
}

function renderBinaryFrame(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  colsInput: number,
  thresholdInput: number,
  intensityInput: number,
  inverted: boolean,
  scratchRef: React.MutableRefObject<HTMLCanvasElement | null>,
  lastWRef: React.MutableRefObject<number>,
  lastHRef: React.MutableRefObject<number>,
  gridRowsRef: React.MutableRefObject<number>
): void {
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  if (videoWidth <= 0 || videoHeight <= 0) return;

  const cols = Math.max(40, Math.min(320, Math.round(colsInput)));
  const threshold = Math.max(0, Math.min(255, Math.round(thresholdInput)));
  // 0 = grayscale, 1 = full original color.
  const intensity = Math.max(0, Math.min(100, Math.round(intensityInput))) / 100;
  const aspect = videoWidth / videoHeight;

  // Choose a pixel font size so the canvas lands near TARGET_CANVAS_WIDTH.
  let charHeight = Math.round(TARGET_CANVAS_WIDTH / cols / 0.6);
  charHeight = Math.max(MIN_CHAR_HEIGHT, Math.min(MAX_CHAR_HEIGHT, charHeight));

  // Measure the real monospace advance at this size so the grid fits exactly.
  ctx.font = `${charHeight}px ${MONO_FONT}`;
  const advance = ctx.measureText('0').width || charHeight * 0.6;

  // Rows needed so that (cols * advance) : (rows * charHeight) matches the
  // source aspect ratio. This is the aspect correction — the grid is never
  // stretched.
  let rows = Math.round((cols * advance) / charHeight / aspect);
  rows = Math.max(8, Math.min(320, rows));
  gridRowsRef.current = rows;

  const nextWidth = Math.max(1, Math.round(cols * advance));
  const nextHeight = Math.max(1, Math.round(rows * charHeight));

  if (lastWRef.current !== nextWidth || lastHRef.current !== nextHeight) {
    canvas.width = nextWidth;
    canvas.height = nextHeight;
    lastWRef.current = nextWidth;
    lastHRef.current = nextHeight;
  }

  // Scratch canvas samples the video at grid resolution (cheap getImageData).
  let scratch = scratchRef.current;
  if (!scratch) {
    scratch = document.createElement('canvas');
    scratchRef.current = scratch;
  }
  scratch.width = cols;
  scratch.height = rows;

  const scratchCtx = scratch.getContext('2d', { alpha: false });
  if (!scratchCtx) return;

  scratchCtx.drawImage(video, 0, 0, cols, rows);
  const data = scratchCtx.getImageData(0, 0, cols, rows).data;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Re-apply context state after any resize.
  ctx.font = `${charHeight}px ${MONO_FONT}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = Math.max(2, Math.min(4, Math.round(charHeight * 0.25)));

  // Draw each pixel's glyph in that pixel's own color, batching consecutive
  // glyphs that share a color so we change fillStyle/shadowColor as rarely as
  // possible. Luminance (Rec. 601) chooses the glyph; RGB chooses the color.
  for (let y = 0; y < rows; y++) {
    const py = y * charHeight;
    let runStartX = 0;
    let runColor = '';
    let run = '';

    for (let x = 0; x < cols; x++) {
      const offset = (y * cols + x) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];

      const luma = (r * 299 + g * 587 + b * 114) / 1000;
      const isOne = luma > threshold;
      const glyph = (isOne !== inverted) ? '1' : '0';

      // Color: blend the pixel toward its grayscale value by intensity, so
      // 0 is monochrome and 1 is the untouched original color.
      let cr = luma + (r - luma) * intensity;
      let cg = luma + (g - luma) * intensity;
      let cb = luma + (b - luma) * intensity;

      // Visibility boost: never let a dark glyph fully vanish on black.
      const mx = cr > cg ? (cr > cb ? cr : cb) : (cg > cb ? cg : cb);
      if (mx < MIN_CHAR_BRIGHTNESS) {
        if (mx <= 0) {
          cr = MIN_CHAR_BRIGHTNESS;
          cg = MIN_CHAR_BRIGHTNESS;
          cb = MIN_CHAR_BRIGHTNESS;
        } else {
          const scale = MIN_CHAR_BRIGHTNESS / mx;
          cr *= scale;
          cg *= scale;
          cb *= scale;
        }
      }

      const color = `rgb(${clamp255(cr)},${clamp255(cg)},${clamp255(cb)})`;

      if (color !== runColor) {
        if (run.length > 0) {
          ctx.fillStyle = runColor;
          ctx.shadowColor = runColor;
          ctx.fillText(run, runStartX * advance, py);
        }
        runColor = color;
        runStartX = x;
        run = glyph;
      } else {
        run += glyph;
      }
    }

    if (run.length > 0) {
      ctx.fillStyle = runColor;
      ctx.shadowColor = runColor;
      ctx.fillText(run, runStartX * advance, py);
    }
  }

  ctx.shadowBlur = 0;
}

function clamp255(value: number): number {
  if (value < 0) return 0;
  if (value > 255) return 255;
  return value | 0;
}
