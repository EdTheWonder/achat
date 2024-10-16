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
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-start p-2 lg:pt-8 space-y-4">
        <div className="w-full max-w-md bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6 shadow-lg mb-8 lg:mb-0 flex flex-col items-center justify-center min-h-screen lg:min-h-0">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Welcome to ChatterBox</h1>
            <AuthForm />
            <div className="mt-4 flex space-x-4 lg:hidden">
              <TryAIButton />
              <WhatsHappeningButton />
            </div>
          </div>
        </div>
        <div id="try-ai" className="w-full max-w-md lg:bg-white lg:bg-opacity-20 lg:backdrop-blur-lg lg:rounded-lg lg:p-6 lg:shadow-lg mt-8 lg:mt-0 flex flex-col items-center justify-center min-h-screen lg:min-h-0">
          <h2 className="text-xl font-semibold mb-4 self-start hidden lg:block">Try AI</h2>
          <h2 className="text-xl font-semibold mb-4 self-start lg:hidden">Try AI</h2>
          <div className="w-full max-w-md bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6 shadow-lg">
            <ChatInterface />
          </div>
        </div>
        <div id="whats-happening" className="w-full max-w-md bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6 shadow-lg mt-8 lg:mt-0 flex flex-col items-center justify-center min-h-screen lg:min-h-0 lg:hidden">
          <ChatFeed />
        </div>
      
      </div>
      <div className="w-full lg:w-1/2 min-h-screen items-center justify-center relative hidden lg:flex">
        <Suspense fallback={<div>Loading...</div>}>
          <WebGLBackground />
        </Suspense>
        <div className="absolute inset-0 flex items-center justify-center p-20 lg:pr-20">
          <div className="w-full max-w-2xl bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6 shadow-lg overflow-y-auto max-h-[80vh]">
            <ChatFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
