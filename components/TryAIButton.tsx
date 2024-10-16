// components/TryAIButton.tsx
"use client"

import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

export default function TryAIButton() {
  const handleClick = () => {
    const tryAISection = document.getElementById('try-ai');
    if (tryAISection) {
      tryAISection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Button onClick={handleClick} className="bg-blue-500 hover:bg-blue-600 text-white">
      <Wand2 className="mr-2 h-4 w-4" />
      Try AI
    </Button>
  );
}
