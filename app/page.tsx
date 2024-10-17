import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import ChatInterface from '@/components/ChatInterface';
import ChatFeed from '@/components/ChatFeed';
import WebGLBackground from '@/components/WebGLBackground';
import TryAIButton from '@/components/TryAIButton';
import WhatsHappeningButton from '@/components/WhatsHappeningButton';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative">
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-between p-2 lg:p-8">
        <div className="w-full max-w-md bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-4 shadow-lg mb-4 lg:mb-0 flex flex-col items-center justify-center">
          <div className="w-full">
            <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-8 text-center">Welcome to fAIcechat</h1>
            <AuthForm />
            <div className="mt-4 flex space-x-2 justify-center lg:hidden">
              <TryAIButton />
              <WhatsHappeningButton />
            </div>
          </div>
        </div>
        <div id="try-ai" className="w-full max-w-md bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-4 shadow-lg mt-4 transition-all duration-300 ease-in-out">
          <h2 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-4 self-start">Try AI</h2>
          <ChatInterface />
        </div>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <WebGLBackground />
      </Suspense>
      <div id="whats-happening" className="w-full lg:w-[calc(50%+6cm)] lg:absolute lg:inset-y-0 lg:right-0 lg:flex lg:items-center lg:justify-end p-2 lg:p-8">
        <div className="w-full bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-4 shadow-lg overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>

          <ChatFeed />
        </div>
      </div>
    </div>
  );
}
