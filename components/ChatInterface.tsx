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
import { RefreshCw } from 'lucide-react';

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
  const [hasUsedOneTimeChat, setHasUsedOneTimeChat] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
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
    if (!isAuthenticated && hasUsedOneTimeChat) {
      toast({
        title: "Please log in to continue chatting",
        description: "You've used your one-time chat. Sign up or log in to continue.",
        variant: "destructive",
      });
      router.push('/');
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

      if (!isAuthenticated) {
        setHasUsedOneTimeChat(true);
      }

      // Save chat to database if authenticated
      if (isAuthenticated) {
        await supabase.from('chats').insert([
          { user_id: (await supabase.auth.getUser()).data.user?.id, message: data.message, response: response.text() }
        ]);
      }
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

  const handleRetry = async (index: number) => {
    if (index % 2 !== 0) return; // Only retry user messages
    setIsLoading(true);
    const messageToRetry = messages[index];
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(messageToRetry.content);
      const response = await result.response;
      const newAiMessage: Message = { role: 'ai', content: response.text() };
      const newMessages = [...messages.slice(0, index + 1), newAiMessage];
      setMessages(newMessages);

      if (isAuthenticated) {
        await supabase.from('chats').insert([
          { user_id: (await supabase.auth.getUser()).data.user?.id, message: messageToRetry.content, response: response.text() }
        ]);
      }
    } catch (error) {
      console.error('AI response error:', error);
      toast({
        title: "Error generating AI response",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  const handleClearChat = () => {
    setMessages([]);
    toast({
      title: "Chat cleared",
      description: "All messages have been removed.",
    });
  };

  return (
    <div className="mt-8 space-y-4 w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">How may I help you?</h2>
        <div className="flex flex-col space-y-2">
          {messages.length > 0 && (
            <Button onClick={handleClearChat} variant="outline" className="w-full">Clear Chat</Button>
          )}
          {isAuthenticated && (
            <Button onClick={handleLogout} variant="destructive" className="w-full">Logout</Button>
          )}
        </div>
      </div>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] break-words ${message.role === 'user' ? 'bg-blue-100 text-black' : 'bg-gray-100 text-black'} p-3 rounded-lg`}>
              <strong className="mr-2">{message.role === 'user' ? 'User:' : 'AI:'}</strong>
              <span>{message.content}</span>
            </div>
            {message.role === 'user' && (
              <Button variant="ghost" size="sm" onClick={() => handleRetry(index)} disabled={isLoading} className="ml-2 self-end">
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-black p-3 rounded-lg">
              <span className="loading-dots">Thinking</span>
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
        <Input {...register('message')} placeholder="Type your message..." className="flex-grow" />
        <Button type="submit" disabled={isLoading}>Send</Button>
      </form>
      {errors.message && <p className="text-red-500 text-sm">{errors.message.message as string}</p>}
      <div className="mt-4 overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: messages.length > 0 ? '0' : '1000px' }}>
        <h3 className="text-lg font-semibold mb-2">Suggestions:</h3>
        <div className="flex flex-wrap gap-2">
          {["How do I make Nigerian party jollof?", "Explain Quantum Superposition to me like I'm 5 years old", "What are some fun activities to do in Port Harcourt?"].map((suggestion, index) => (
            <Button key={index} onClick={() => setValue('message', suggestion)} variant="outline" className="text-sm py-1 px-2">
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
