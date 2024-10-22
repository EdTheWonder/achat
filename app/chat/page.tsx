"use client"

import { useState, useEffect } from 'react';
import ChatInterface from '@/components/ChatInterface';
import WebGLBackground from '@/components/WebGLBackground';
import { Suspense } from 'react';
import UsernameSelectionPopup from '@/components/UsernameSelectionPopup';

export default function ChatPage() {
  const [showUsernamePopup, setShowUsernamePopup] = useState(false);

  useEffect(() => {
    const needsUsername = localStorage.getItem('needsUsername');
    if (needsUsername === 'true') {
      setShowUsernamePopup(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
      <Suspense fallback={<div>Loading...</div>}>
        <WebGLBackground />
      </Suspense>
      <div className="z-10 w-full max-w-2xl bg-white dark:bg-gray-800 bg-opacity-20 dark:bg-opacity-30 backdrop-blur-lg p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Chat with fAIcechat</h1>
        <ChatInterface initialMessages={[]} threadId={null} />
      </div>
      <UsernameSelectionPopup
        isOpen={showUsernamePopup}
        onClose={() => setShowUsernamePopup(false)}
      />
    </div>
  );
}
