import { Suspense } from 'react';
import AuthForm from '@/components/AuthForm';
import WebGLBackground from '@/components/WebGLBackground';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Suspense fallback={<div>Loading...</div>}>
        <WebGLBackground />
      </Suspense>
      <main className="z-10 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">Welcome to ChatterBox</h1>
        <AuthForm />
      </main>
    </div>
  );
}