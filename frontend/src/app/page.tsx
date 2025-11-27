'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Import Home from existing app to reuse UI
import { Home } from './App';

// Ensure client-side only rendering for components using browser APIs
const HomeClient = dynamic(() => Promise.resolve(Home), { ssr: false });

export default function IndexPage() {
  return <HomeClient />;
}

