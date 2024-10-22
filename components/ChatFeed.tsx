"use client"

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';
import ChatInterface, { ChatInterfaceProps } from './ChatInterface';
import { ChatEntry as ChatInterfaceEntry } from '@/types/chat';

type ChatEntry = ChatInterfaceEntry & {
  id: string;
  user_id: string;
  thread_id: string;
  message: string;
  response: string;
  created_at: string;
  username: string;
};

type Thread = {
  id: string;
  messages: ChatEntry[];
  isExpanded: boolean;
};

export default function ChatFeed() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [expandedThreadId, setExpandedThreadId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchChatEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('chats')
          .select(`
            id,
            user_id,
            thread_id,
            message,
            response,
            created_at,
            users (username)
          `)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching chat entries:', error);
          toast.error(`Error fetching chat entries: ${error.message}`);
        } else {
          const groupedThreads = data.reduce((acc: { [key: string]: Thread }, entry: any) => {
            if (!acc[entry.thread_id]) {
              acc[entry.thread_id] = {
                id: entry.thread_id,
                messages: [],
                isExpanded: false
              };
            }
            acc[entry.thread_id].messages.push({
              id: entry.id,
              user_id: entry.user_id,
              thread_id: entry.thread_id,
              role: 'user',
              message: entry.message,
              response: entry.response,
              created_at: entry.created_at,
              username: entry.users?.username || 'Anonymous',
            });
            return acc;
          }, {});
          setThreads(Object.values(groupedThreads).sort((a, b) => 
            new Date(b.messages[b.messages.length - 1].created_at).getTime() - new Date(a.messages[a.messages.length - 1].created_at).getTime()
          ));
        }
      } catch (error) {
        console.error('Unexpected error fetching chat entries:', error);
        toast.error("An unexpected error occurred while fetching chat entries.");
      }
    };

    fetchChatEntries();
  }, [supabase, toast]);

  const toggleThreadExpansion = (threadId: string) => {
    setExpandedThreadId(expandedThreadId === threadId ? null : threadId);
  };

  const renderThreadContent = (thread: Thread) => {
    const isExpanded = expandedThreadId === thread.id;
    const messagesToShow = isExpanded ? thread.messages : [thread.messages[0]];

    return (
      <>
        <div className="space-y-2">
          {messagesToShow.map((message, index) => (
            <React.Fragment key={index}>
              <div className="bg-blue-100 text-black p-2 rounded-lg">
                <p className="text-xs font-semibold mb-1">{message.username}</p>
                <p className="text-sm">{message.message}</p>
              </div>
              {message.response && (
                <div className="bg-gray-100 text-black p-2 rounded-lg">
                  <p className="text-xs font-semibold mb-1">AI</p>
                  <p className="text-sm">{message.response}</p>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <Button onClick={() => toggleThreadExpansion(thread.id)} variant="ghost" size="sm" className="mt-2">
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              View Full Thread
            </>
          )}
        </Button>
      </>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">What's Happening</h2>
      <div className="space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
        {threads.map((thread) => (
          <Card key={thread.id} className="w-full bg-white dark:bg-gray-800 bg-opacity-20 dark:bg-opacity-30 backdrop-blur-lg">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar>
                <AvatarFallback>{thread.messages[0]?.username.charAt(0).toUpperCase() || ''}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{thread.messages[0]?.username ? `@${thread.messages[0].username}` : ''}</CardTitle>
                <p className="text-sm text-muted-foreground">{new Date(thread.messages[thread.messages.length - 1]?.created_at).toLocaleString()}</p>
              </div>
            </CardHeader>
            <CardContent>
              {renderThreadContent(thread)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
