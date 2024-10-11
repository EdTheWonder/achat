import ChatInterface from '@/components/ChatInterface';
import WebGLBackground from '@/components/WebGLBackground';
import { Suspense } from 'react';

export default function ChatPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Suspense fallback={<div>Loading...</div>}>
        <WebGLBackground />
      </Suspense>
      <div className="z-10 w-full max-w-2xl bg-gray/80 backdrop-blur-md p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Chat with ChatterBox</h1>
        <ChatInterface />
      </div>
    </div>
  );
}
