"use client"

import { useState, useEffect } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const schema = z.object({
  message: z.string().min(1),
});

type Message = {
  role: 'user' | 'ai';
  content: string;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, [supabase.auth]);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in to chat",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: data.message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(data.message);
      const response = await result.response;
      const aiMessage: Message = { role: 'ai', content: response.text() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      toast({
        title: "Error generating AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out successfully",
      });
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error logging out",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="mt-8 text-center">
        <p className="text-lg font-semibold">Please log in to use the chat.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Log In</Button>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Chat Dashboard</h2>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className={`p-3 rounded-lg ${message.role === 'user' ? 'bg-blue-100 text-black' : 'bg-gray-100 text-black'}`}>
            <strong>{message.role === 'user' ? 'You:' : 'AI:'}</strong> {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)} className="flex space-x-2">
        <Input {...register('message')} placeholder="Type your message..." className="flex-grow" />
        <Button type="submit" disabled={isLoading}>Send</Button>
      </form>
      {errors.message && <p className="text-red-500 text-sm">{errors.message.message as string}</p>}
    </div>
  );
}