import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import LeftAlignedSphere from '@/components/LeftAlignedSphere';
import ChatInterface from '@/components/ChatInterface';
import ChatFeed from '@/components/ChatFeed';
import WebGLBackground from '@/components/WebGLBackground';
import TryAIButton from '@/components/TryAIButton';
import WhatsHappeningButton from '@/components/WhatsHappeningButton';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-between p-4 lg:p-16 lg:space-y-4">
        <div className="w-full max-w-md bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6 shadow-lg mb-4 lg:mb-0 flex flex-col items-center justify-center min-h-[80vh] lg:min-h-0">
          <div className="w-full">
            <h1 className="text-3xl font-bold mb-8 text-center">Welcome to ChatterBox</h1>
            <AuthForm />
            <div className="mt-8 flex space-x-4 justify-center lg:hidden">
              <TryAIButton />
              <WhatsHappeningButton />
            </div>
          </div>
        </div>
        <div id="try-ai" className="w-full max-w-md bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 self-start hidden lg:block">Try AI</h2>
          <h2 className="text-xl font-semibold mb-4 self-start lg:hidden">Try AI</h2>
          <div>
            <ChatInterface />
          </div>
        </div>
    
      
      </div>
      <div className="w-full lg:w-1/2 min-h-screen flex items-center justify-end pr-16 relative hidden lg:flex">
        <Suspense fallback={<div>Loading...</div>}>
          <WebGLBackground />
        </Suspense>
        <div className="absolute inset-0 flex items-center justify-center p-20 lg:pr-20">
            <ChatFeed />
          </div>
        </div>
      </div>
  );
}
