import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from '@/hooks/use-toast';

interface UsernameSelectionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsernameSelectionPopup({ isOpen, onClose }: UsernameSelectionPopupProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('users')
        .upsert({ id: user.id, username: username });

      if (error) throw error;

      localStorage.removeItem('needsUsername');
      toast({
        title: "Username set successfully",
        description: "You can now use the app.",
      });
      onClose();
    } catch (error) {
      console.error('Error setting username:', error);
      toast({
        title: "Error setting username",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Your Username</DialogTitle>
          <DialogDescription>
            Please choose a username to continue using the app.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="mb-4"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Setting...' : 'Set Username'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

