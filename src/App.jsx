import React, { useState, useEffect } from 'react';
import { Zap, TrendingUp, ThumbsUp, Wallet, Activity, Hash, Eye } from 'lucide-react';

const App = () => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  // Environment Detection Logic
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasMiniAppMode = urlParams.has('mode') && urlParams.get('mode') === 'miniapp';
    setIsMiniApp(hasMiniAppMode);
    
    console.log('Environment detected:', hasMiniAppMode ? 'MiniApp Context' : 'Farcaster/Web Context');
  }, []);

  // Mock Wallet Connection Handler
  const handleConnect = () => {
    console.log('Wallet connection initiated for Farcaster/Web context.');
    setIsWalletConnected(true);
  };

  // Mock Data for Vibe Score Panel
  const mockVibeData = {
    overallScore: 7.8,
    maxScore: 10,
    trendingTopic: '#Web3Elections',
    statusMessage: 'Community sentiment is currently Optimistic on long-term growth, but watch out for short-term sentiment shifts.',
    scoreColor: 'text-emerald-400',
    bgGradient: 'from-emerald-500/20 to-blue-500/20'
  };

  // User Greeting Logic
  const getUserGreeting = () => {
    if (isMiniApp) {
      return 'Welcome, Vibechecker!';
    }
    return isWalletConnected ? 'Welcome, Vibechecker!' : 'Connect your wallet to begin!';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Load Tailwind CSS */}
      <script src="https://cdn.tailwindcss.com"></script>
      
      {/* Header Section */}
      <header className="relative overflow-hidden bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl shadow-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">VibeCheck</h1>
                <p className="text-sm text-gray-400">AI-Powered Community Sentiment</p>
              </div>
            </div>

            {/* Conditional Connect Wallet Button */}
            {!isMiniApp && (
              <button
                onClick={handleConnect}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg ${
                  isWalletConnected
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl hover:scale-105'
                }`}
              >
                <Wallet className="h-5 w-5" />
                <span className="hidden sm:inline">
                  {isWalletConnected ? 'Wallet Connected' : 'Connect Wallet'}
                </span>
                <span className="sm:hidden">
                  {isWalletConnected ? 'Connected' : 'Connect'}
                </span>
              </button>
            )}
          </div>

          {/* User Greeting */}
          <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <p className="text-xl font-semibold text-emerald-400 flex items-center">
              <ThumbsUp className="h-5 w-5 mr-2" />
              {getUserGreeting()}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {isMiniApp ? 'MiniApp Mode Active' : 'Web/Farcaster Mode'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vibe Score Panel */}
        <div className={`bg-gradient-to-br ${mockVibeData.bgGradient} p-8 rounded-2xl shadow-2xl border border-gray-700 mb-8`}>
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Activity className="h-8 w-8 text-emerald-400 mr-3" />
              <h2 className="text-3xl font-bold text-white">Community Vibe Score</h2>
            </div>
            
            {/* Overall Score Display */}
            <div className="relative">
              <div className={`text-8xl font-black ${mockVibeData.scoreColor} mb-2`}>
                {mockVibeData.overallScore}
              </div>
              <div className="text-2xl text-gray-400 font-semibold">
                / {mockVibeData.maxScore}
              </div>
              <div className="absolute -top-4 -right-4 w-4 h-4 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Score Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Trending Topic */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600">
              <div className="flex items-center mb-3">
                <Hash className="h-6 w-6 text-blue-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Top Trending</h3>
              </div>
              <p className="text-2xl font-bold text-blue-400">{mockVibeData.trendingTopic}</p>
              <div className="flex items-center mt-2 text-sm text-gray-400">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>Trending in Web3 Community</span>
              </div>
            </div>

            {/* Sentiment Indicator */}
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-600">
              <div className="flex items-center mb-3">
                <Eye className="h-6 w-6 text-emerald-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Sentiment</h3>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                <p className="text-lg font-semibold text-emerald-400">Optimistic</p>
              </div>
              <p className="text-sm text-gray-400 mt-1">Long-term growth potential</p>
            </div>
          </div>

          {/* Status Message */}
          <div className="bg-gray-800/70 p-6 rounded-xl border border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <Activity className="h-5 w-5 text-yellow-400 mr-2" />
              Current Analysis
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {mockVibeData.statusMessage}
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Real-time Monitoring Card */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-emerald-500 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Activity className="h-6 w-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white ml-3">Real-time Monitoring</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Track community sentiment across multiple platforms and social channels.
            </p>
          </div>

          {/* AI Insights Card */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white ml-3">AI Insights</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Advanced machine learning algorithms analyze sentiment patterns and trends.
            </p>
          </div>

          {/* Community Pulse Card */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <ThumbsUp className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white ml-3">Community Pulse</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Get instant feedback on community mood and engagement levels.
            </p>
          </div>
        </div>

        {/* Environment Status Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gray-800 rounded-full border border-gray-600">
            <div className={`w-2 h-2 rounded-full mr-2 ${isMiniApp ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`}></div>
            <span className="text-sm text-gray-400">
              Running in {isMiniApp ? 'MiniApp' : 'Web/Farcaster'} mode
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
