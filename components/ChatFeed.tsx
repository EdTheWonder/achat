"use client"

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
    <div className="space-y-4 p-20 sm:p-4 max-w-2xl mx-auto bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-20 shadow-lg">
      <h2 className="text-2xl font-bold lg">What's Happening</h2>
      <div className="space-y-8 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
        {Object.entries(groupChatsByUser(chatEntries)).map(([userId, userChats]) => (
          <div key={userId} className="bg-white bg-opacity-10 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">User: {userEmails[userId] || userId}</h3>
            {userChats.map((entry) => (
              <div key={entry.created_at} className="flex flex-col space-y-2 mb-4">
                <div className="flex justify-end">
                  <div className="bg-blue-100 text-black p-3 rounded-lg max-w-[70%] break-words">
                    <p>{entry.message}</p>
                    <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-black p-3 rounded-lg max-w-[70%] break-words">
                    <p>{entry.response}</p>
                    <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
