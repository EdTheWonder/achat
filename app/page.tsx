import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import ChatInterface from '@/components/ChatInterface';
import WebGLBackground from '@/components/WebGLBackground';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <WebGLBackground />
      </Suspense>
      <main className="z-10 w-full max-w-md">
        <AuthForm />
        <ChatInterface />
      </main>
    </div>
  );
}