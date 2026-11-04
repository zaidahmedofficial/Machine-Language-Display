# BINARY — see video in 0 and 1

Import a video from your PC and watch it rendered, in real time, entirely as a
grid of `1`s and `0`s. Everything runs in the browser — there are no uploads, no
API routes, no database, and no server-side video processing.

## Features

- Drag-and-drop zone and file picker (`accept="video/*"`).
- Hidden `<video>` decodes frames; `requestAnimationFrame` + `drawImage` sample
  them through an offscreen canvas at a capped resolution.
- Per-pixel luminance (Rec. 601) is thresholded to `1` or `0` and drawn as a
  glowing green (`#00FF41`) monospace grid on black, with a CRT scanline look.
- Aspect-corrected grid so the video is never stretched.
- Live controls: **Play / Pause / Restart / Reset**, **Resolution** (40–320
  columns), **Threshold** (0–255), **Invert** (swap 0/1), **Show original**
  (side-by-side), and an **FPS** counter.
- Handles empty, loading, ended, and unsupported-file states; object URLs and
  animation frames are cleaned up on unmount.
- Keyboard: `Space` play/pause, `R` restart, `Esc` remove video.
- Responsive, dark, accessible (labelled controls, `role="switch"`, live status).

## Running it

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm start       # serve the production build
npm run lint
```

## Stack

Next.js (App Router) · TypeScript (strict) · React · Tailwind CSS.
No other runtime dependencies — pixel sampling is written by hand.

## Project layout

```
src/
  app/
    layout.tsx              Root layout + metadata
    page.tsx                Main screen: import, canvas, controls, status
    globals.css             Terminal theme, scanlines, sliders, toggles
  components/
    FileImport.tsx          Drag-and-drop + file input zone
    EmptyState.tsx          Hero / no-file state
    Controls.tsx            Playback, resolution, threshold, invert, FPS
  hooks/
    useVideoBinaryEngine.ts Video decode + binary sampling + render loop
```
