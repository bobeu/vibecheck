import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'VibeCheck - AI-Powered Crypto Project Viability Predictor',
  description: 'Instant Vibrancy Score for crypto projects. Powered by AI and optimized for Celo MiniPay and Farcaster.',
  keywords: ['crypto', 'viability', 'AI', 'Celo', 'MiniPay', 'Farcaster'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

