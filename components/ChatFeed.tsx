"use client"

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type ChatEntry = {
  user_id: string;
  message: string;
  response: string;
  created_at: string;
};

export default function ChatFeed() {
  const [chatEntries, setChatEntries] = useState<ChatEntry[]>([]);
  const [userEmails, setUserEmails] = useState<{[key: string]: string}>({});
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchChatEntries = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching chat entries:', error);
      } else {
        setChatEntries(data);
        console.log('Fetched chat entries:', data);
      }
    };

    fetchChatEntries();

    const subscription = supabase
      .channel('public:chats')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'chats' },
        (payload: { new: ChatEntry }) => {
          console.log('New chat entry:', payload.new);
          setChatEntries((prevEntries) => [payload.new, ...prevEntries]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    const fetchUserEmails = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email');
      if (error) {
        console.error('Error fetching user emails:', error);
      } else {
        const emailMap = data.reduce<{[key: string]: string}>((acc, user) => {
          acc[user.id] = user.email;
          return acc;
        }, {});
        setUserEmails(emailMap);
      }
    };
    fetchUserEmails();
  }, [supabase]);

  return (
    <div className="space-y-4 p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">Feed</h2>
      <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
        {chatEntries.map((entry) => (
          <div key={entry.user_id + entry.created_at} className="border p-4 rounded-lg">
            <p className="mt-2 break-words">Email: {entry.message}</p>
            <p className="mt-2 break-words">AI: {entry.response}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
