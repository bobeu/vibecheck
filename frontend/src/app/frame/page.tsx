import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'VibeCheck – Vibrancy Score',
  description: 'Instant Vibrancy Score teaser. Launch Mini App for full report.',
  openGraph: {
    title: 'VibeCheck – Vibrancy Score',
    description: 'Instant Vibrancy Score teaser. Launch Mini App for full report.',
    images: ['/frame.svg'],
  },
  other: {
    'fc:frame:version': 'vNext',
    'fc:frame:image': '/frame.svg',
    'fc:frame:button:1': 'View Full Report (1 cUSD)',
    'fc:frame:button:1:action': 'post_redirect',
    'fc:frame:button:1:target': '/api/frame/launch',
  },
};

export default function FramePage() {
  return (
    <main 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        margin: 0, 
        padding: 0, 
        fontFamily: 'Inter, system-ui, sans-serif', 
        background: '#0b0f1a', 
        color: '#e6edf3' 
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
        <div style={{ 
          marginBottom: '24px',
          padding: '32px',
          background: 'linear-gradient(135deg, rgba(61, 100%, 65%, 0.1) 0%, rgba(145, 69%, 53%, 0.1) 100%)',
          borderRadius: '16px',
          border: '1px solid rgba(61, 100%, 65%, 0.2)'
        }}>
          <Image 
            src="/frame.svg" 
            alt="Vibrancy Score" 
            width={480}
            height={320}
            style={{ width: '100%', maxWidth: '480px', height: 'auto', borderRadius: '12px' }} 
            priority
          />
        </div>
        <div style={{ 
          padding: '20px',
          background: 'rgba(220, 13%, 12%, 0.8)',
          borderRadius: '12px',
          border: '1px solid rgba(220, 13%, 20%, 0.5)'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            background: 'linear-gradient(135deg, hsl(61, 100%, 65%) 0%, hsl(145, 69%, 53%) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            VibeCheck Vibrancy Score
          </h1>
          <p style={{ 
            opacity: 0.8, 
            marginBottom: '16px',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            Get instant AI-powered project viability analysis
          </p>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, hsl(61, 100%, 65%) 0%, hsl(61, 100%, 70%) 100%)',
            borderRadius: '8px',
            color: '#0b0f1a',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 4px 20px -4px hsl(61, 100%, 65% / 0.25)'
          }}>
            <span>💰</span>
            <span>View Full Report (1 cUSD)</span>
          </div>
          <p style={{ 
            opacity: 0.6, 
            marginTop: '20px',
            fontSize: '14px'
          }}>
            Click the button in Warpcast to launch the Mini App
          </p>
        </div>
      </div>
    </main>
  );
}

