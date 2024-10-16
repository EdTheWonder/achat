import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import LeftAlignedSphere from '@/components/LeftAlignedSphere';
import ChatInterface from '@/components/ChatInterface';
import ChatFeed from '@/components/ChatFeed';
import WebGLBackground from '@/components/WebGLBackground';

export default function Home() {
  return (
    <div className="min-h-screen flex relative">
      <div className="w-1/2 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">Welcome to ChatterBox</h1>
          <AuthForm />
          <div className="mt-12"> {/* Increased top margin for more padding */}
            <h2 className="text-xl font-semibold mb-4">Try AI</h2>
            <ChatInterface />
          </div>
        </div>
      </div>
      <div className="w-1/2 min-h-screen relative">
        <Suspense fallback={<div>Loading...</div>}>
          <WebGLBackground />
        </Suspense>
      </div>
      <div className="w-1/2.5 pl-4 overflow-y-auto max-h-screen absolute right-0 top-0 bottom-0">
        <ChatFeed />
      </div>
    </div>
  );
}
