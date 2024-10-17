"use client"

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@chakra-ui/react';

type ChatEntry = {
  id: string;
  user_id: string;
  message: string;
  response: string;
  created_at: string;
  username: string;
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
  const [expandedChats, setExpandedChats] = useState<{[key: string]: boolean}>({});
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchChatEntries = async () => {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          users:user_id (
            username,
            user_metadata
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching chat entries:', error);
      } else {
        setChatEntries(data.map((entry: any) => ({
          ...entry,
          username: entry.users?.username || entry.users?.user_metadata?.username || 'Unknown User'
        })));
      }
    };

    fetchChatEntries();

    const subscription = supabase
      .channel('public:chats')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'chats' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('username, user_metadata')
              .eq('id', (payload.new as ChatEntry).user_id)
              .single();
            if (!userError) {
              setChatEntries((prevEntries) => [{
                ...(payload.new as ChatEntry), 
                username: userData?.username || userData?.user_metadata?.username || 'Unknown User'
              }, ...prevEntries]);
            }
          } else if (payload.eventType === 'UPDATE') {
            setChatEntries((prevEntries) =>
              prevEntries.map((entry) =>
                entry.id === (payload.new as ChatEntry).id 
                  ? {...(payload.new as ChatEntry), username: entry.username || 'Unknown User'} 
                  : entry
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setChatEntries((prevEntries) =>
              prevEntries.filter((entry) => entry.id !== (payload.old as ChatEntry).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);



  const toggleChatExpansion = (userId: string, chatIndex: number) => {
    setExpandedChats(prev => ({
      ...prev,
      [`${userId}-${chatIndex}`]: !prev[`${userId}-${chatIndex}`]
    }));
  };

  return (
    <div className="space-y-4 px-4">
      <h2 className="text-2xl font-bold">What's Happening</h2>
      <div className="space-y-8 max-h-[calc(100vh-10rem)] overflow-y-auto">
        {Object.entries(groupChatsByUser(chatEntries)).map(([userId, userChats]) => (
          <div key={userId} className="space-y-4 border-b border-gray-200 pb-8">
            <h3 className="font-semibold">
              @{userChats[0].username || 'Unknown User'}
            </h3>
            {userChats.map((entry, index) => (
              <div key={`${entry.created_at}-${index}`} className="space-y-2">
                <div className="flex justify-end">
                  <div className="bg-blue-100 text-black p-2 rounded-lg max-w-[80%] break-words">
                    <p className="text-sm">
                      {expandedChats[`${userId}-${index}`] ? entry.message : `${entry.message.substring(0, 100)}${entry.message.length > 100 ? '...' : ''}`}
                    </p>
                    <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-black p-2 rounded-lg max-w-[80%] break-words">
                    <p className="text-sm">
                      {expandedChats[`${userId}-${index}`] ? entry.response : `${entry.response.substring(0, 100)}${entry.response.length > 100 ? '...' : ''}`}
                    </p>
                    <span className="text-xs text-gray-500">{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {(entry.message.length > 100 || entry.response.length > 100) && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-blue-500 self-end"
                    onClick={() => toggleChatExpansion(userId, index)}
                  >
                    {expandedChats[`${userId}-${index}`] ? 'Collapse' : 'View full chat'}
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
