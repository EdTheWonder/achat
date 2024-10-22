export interface ChatEntry {
  role: 'user' | 'ai';
  message: string;  
  response: string;
  created_at: string;
  username: string;
  thread_id: string;
  id: string;
  user_id: string;
  
}

