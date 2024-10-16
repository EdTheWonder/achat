"use client"

import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

export default function WhatsHappeningButton() {
  const handleClick = () => {
    const feedSection = document.getElementById('whats-happening');
    if (feedSection) {
      feedSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Button onClick={handleClick} variant="outline">
      <Activity className="mr-2 h-4 w-4" />
      What's Happening
    </Button>
  );
}
