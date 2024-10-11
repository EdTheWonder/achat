"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { GoogleGenerativeAI } from "@google/generative-ai";

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

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    const userMessage: Message = { role: 'user', content: data.message };
    setMessages(prev => [...prev, userMessage]);

    try {
      const genAI = new GoogleGenerativeAI(process.env.GoogleAIStudioKey!);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      const result = await model.generateContent(data.message);
      const response = await result.response;
      const aiMessage: Message = { role: 'ai', content: response.text() };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  return (
    <div className="mt-8 space-y-4">
      <div className="space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`p-2 rounded ${message.role === 'user' ? 'bg-blue-100' : 'bg-green-100'}`}>
            <strong>{message.role === 'user' ? 'You:' : 'AI:'}</strong> {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-2">
        <Input {...register('message')} placeholder="Type your message..." className="flex-grow" />
        <Button type="submit" disabled={isLoading}>Send</Button>
      </form>
      {errors.message && <p className="text-red-500 text-sm">{errors.message.message}</p>}
    </div>
  );
}