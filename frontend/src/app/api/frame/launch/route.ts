import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Mock a launch action by redirecting into the Mini App mode
  // In production, set this to your deployed Mini App URL
  const miniAppUrl = new URL('/?mode=miniapp', request.url);
  return NextResponse.redirect(miniAppUrl, { status: 307 });
}

// Handle GET requests as well (for direct navigation)
export async function GET(request: NextRequest) {
  const miniAppUrl = new URL('/?mode=miniapp', request.url);
  return NextResponse.redirect(miniAppUrl, { status: 307 });
}

