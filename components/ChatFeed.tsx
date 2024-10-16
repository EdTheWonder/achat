"use client"

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@chakra-ui/react';

type ChatEntry = {
  user_id: string;
  message: string;
  response: string;
  created_at: string;
};

const groupChatsByUser = (entries: ChatEntry[]) => {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.user_id]) {
      acc[entry.user_id] = [];
    }
    acc[entry.user_id].push(entry);
    return acc;
  }, {} as Record<string, ChatEntry[]>);
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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">What's Happening</h2>
      <div className="space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
        {Object.entries(groupChatsByUser(chatEntries)).map(([userId, userChats]) => (
          <div key={userId} className="space-y-2">
            <h3 className="font-semibold">User: {userEmails[userId] || userId}</h3>
            {userChats.map((entry) => (
              <div key={entry.created_at} className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-blue-100 text-black p-2 rounded-lg max-w-[80%] break-words">
                    <p className="text-sm">{entry.message.length > 100 ? `${entry.message.substring(0, 100)}...` : entry.message}</p>
                    <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-black p-2 rounded-lg max-w-[80%] break-words">
                    <p className="text-sm">{entry.response.length > 100 ? `${entry.response.substring(0, 100)}...` : entry.response}</p>
                    <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {(entry.message.length > 100 || entry.response.length > 100) && (
                  <Button variant="link" size="sm" className="text-blue-500 self-end">
                    View full chat
                  </Button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
