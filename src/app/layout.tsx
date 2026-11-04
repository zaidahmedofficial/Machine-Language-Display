import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BINARY — see video in 0 and 1',
  description:
    'Import a video from your PC and watch it rendered as binary matrix art in real time. Zero uploads. Zero server.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scanlines binary-bg">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="text-glow">
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
