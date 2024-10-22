"use client"

import { useState, useEffect, useRef } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RefreshCw, Upload } from 'lucide-react';
import PDFProcessor, { PDFProcessorProps } from './PDFProcessor';
import { ChatEntry } from '../types/chat';

const schema = z.object({
  message: z.string().min(1),
});

type Message = {
  role: 'user' | 'ai';
  content: string;
};

type Thread = {
  id: string;
  messages: Message[];
};

export interface ChatInterfaceProps {
  initialMessages: Message[];
  threadId: string | null;
}

export default function ChatInterface({ initialMessages, threadId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasUsedOneTimeChat, setHasUsedOneTimeChat] = useState(false);
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchUsername = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.username) {
        setUsername(user.user_metadata.username);
      }
    };
    fetchUsername();
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

    let thread = currentThread;
    if (!thread) {
      thread = { id: Date.now().toString(), messages: [] };
      setCurrentThread(thread);
    }

    const updatedMessages = [...thread.messages, userMessage];
    setCurrentThread({ ...thread, messages: updatedMessages });

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_AI_STUDIO_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const chat = model.startChat({
        history: updatedMessages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: msg.content,
        })),
      });

      const result = await chat.sendMessage("Please provide a well-formatted response with proper grammar, punctuation, and paragraphing: " + data.message);
      const response = await result.response;
      const aiMessage: Message = { role: 'ai', content: response.text() };
      const newMessages = [...updatedMessages, aiMessage];
      setCurrentThread({ ...thread, messages: newMessages });

      if (!isAuthenticated) {
        setHasUsedOneTimeChat(true);
      }

      // Save chat to database if authenticated
      if (isAuthenticated) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('Error getting user:', userError);
          throw userError;
        }

        const currentTime = new Date().toISOString();

        const { error: insertError } = await supabase.from('chats').insert([
          { 
            user_id: userData.user?.id, 
            thread_id: thread.id,
            message: data.message,
            response: aiMessage.content,
            created_at: currentTime,
          }
        ]);

        if (insertError) {
          console.error('Error inserting chat:', insertError);
          throw insertError;
        }

        console.log('Chat saved successfully');
      }
    } catch (error) {
      console.error('AI response or database error:', error);
      toast({
        title: "Error processing your request",
        description: "There was an issue with the AI response or saving the chat. Please try again.",
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
    <div className="mt-4 space-y-4 w-full transition-all duration-300 ease-in-out relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold">How may I help you?</h2>
        <div className="flex flex-col items-end space-y-2">
          {isAuthenticated && username && (
            <div className="text-sm font-medium">@{username}</div>
          )}
          <div className="flex space-x-2">
            {messages.length > 0 && (
              <Button onClick={handleClearChat} variant="outline" size="sm">Clear</Button>
            )}
            {isAuthenticated && (
              <Button onClick={handleLogout} variant="destructive" size="sm">Logout</Button>
            )}
          </div>
        </div>
      </div>
      {currentThread && currentThread.messages.length > 0 && (
        <div className="space-y-2 max-h-[40vh] sm:max-h-[50vh] overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 bg-opacity-50 dark:bg-opacity-50 rounded-lg">
          {currentThread.messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] break-words ${message.role === 'user' ? 'bg-blue-100 dark:bg-blue-900 text-black dark:text-white' : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white'} p-2 rounded-lg text-sm`}>
                <strong className="mr-1 text-xs">{message.role === 'user' ? 'You:' : 'AI:'}</strong>
                <span>{message.content}</span>
              </div>
              {message.role === 'user' && (
                <Button variant="ghost" size="sm" onClick={() => handleRetry(index)} disabled={isLoading} className="ml-1 self-end p-1">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-black p-2 rounded-lg text-sm">
                <span className="loading-dots">Thinking</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)} className="flex space-x-2">
        <Input {...register('message')} placeholder="Type your message..." className="flex-grow text-sm" />
        <PDFProcessor onUpload={(text: string) => {
          // Do nothing with the text, just log it or ignore it
          console.log("PDF summarized:", text);
        }} />
        <Button type="submit" disabled={isLoading} size="sm">Send</Button>
      </form>
      {errors.message && <p className="text-red-500 text-xs">{errors.message.message as string}</p>}
      {messages.length === 0 && (
        <div className="mt-2 overflow-hidden transition-all duration-300 ease-in-out">
          <h3 className="text-sm font-semibold mb-1">Suggestions:</h3>
          <div className="flex flex-wrap gap-1">
            <Button onClick={() => setValue('message', "How do I make Nigerian party jollof?")} variant="outline" size="sm" className="text-xs py-1 px-2">
              How do I make Nigerian party jollof?
            </Button>
            <Button onClick={() => setValue('message', "Explain Quantum Superposition to me like I'm 5 years old")} variant="outline" size="sm" className="text-xs py-1 px-2">
              Explain Quantum Superposition to me like I'm 5 years old
            </Button>
            <Button onClick={() => setValue('message', "What are some fun activities to do in Port Harcourt?")} variant="outline" size="sm" className="text-xs py-1 px-2">
              What are some fun activities to do in Port Harcourt?
            </Button>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
