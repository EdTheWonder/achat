import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import LeftAlignedSphere from '@/components/LeftAlignedSphere';
import ChatInterface from '@/components/ChatInterface';
import ChatFeed from '@/components/ChatFeed';
import WebGLBackground from '@/components/WebGLBackground';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">Welcome to ChatterBox</h1>
          <AuthForm />
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Try AI</h2>
            <ChatInterface />
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 min-h-screen relative">
        <Suspense fallback={<div>Loading...</div>}>
          <WebGLBackground />
        </Suspense>
        <div className="absolute inset-0 p-4 pl-20 center overflow-y-auto">
          <ChatFeed />
        </div>
      </div>
    </div>
  );
}
