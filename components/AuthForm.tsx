"use client"

import { useState, useEffect } from 'react';
import { FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Twitter, Mail } from 'lucide-react';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, {
    message: "Username can only contain letters, numbers, and underscores",
  }),
});

const isUsernameUnique = async (username: string) => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking username uniqueness:', error);
    return false;
  }

  return !data;
};

export default function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/chat');
      }
    };
    checkAuth();
  }, [supabase.auth, router]);

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsLoading(true);
    try {
      if (isSignUp) {
        const usernameUnique = await isUsernameUnique(data.username);
        if (!usernameUnique) {
          toast({
            title: "Username already taken",
            description: "Please choose a different username.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        // Use Supabase's signUp method with additional data
        const { data: authData, error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              username: data.username,
            },
          },
        });

        if (error) throw error;

        if (authData.user) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({ id: authData.user.id, username: data.username });

          if (insertError) {
            console.error('Error inserting username:', insertError);
            toast({
              title: "Error saving username",
              description: "Your account was created, but there was an issue saving your username.",
              variant: "destructive",
            });
          }

          router.push('/chat');
        }

        toast({
          title: "Account created successfully",
          description: "Please check your email to confirm your account.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword(data);
        if (error) throw error;
        toast({
          title: "Logged in successfully",
        });
        router.push('/chat');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      toast({
        title: "Authentication error",
        description: "Please check your credentials and try again. If the problem persists, contact support.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast({
        title: "Google sign-in error",
        description: "An error occurred during Google sign-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTwitterSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitter',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Twitter sign-in error:', error);
      toast({
        title: "Twitter sign-in error",
        description: "An error occurred during Twitter sign-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit as SubmitHandler<FieldValues>)} className="space-y-4">
        <div className="flex flex-col items-start space-y-1">
          <Label htmlFor="email" className="text-sm font-medium">Email</Label>
          <Input id="email" {...register('email')} className="w-full" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message as string}</p>}
        </div>
        <div className="flex flex-col items-start space-y-1">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <Input id="password" type="password" {...register('password')} className="w-full" />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message as string}</p>}
        </div>
        {isSignUp && (
          <div className="flex flex-col items-start space-y-1">
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <Input id="username" {...register('username')} className="w-full" />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message as string}</p>}
          </div>
        )}
        <Button type="submit" className="w-full mt-2" disabled={isLoading}>
          {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Log In')}
        </Button>
      </form>
      <div className="space-y-2">
        <Button type="button" variant="outline" className="w-full flex items-center justify-center" onClick={handleGoogleSignIn}>
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>
      </div>
      <Button type="button" variant="link" className="w-full" onClick={() => setIsSignUp(!isSignUp)}>
        {isSignUp ? 'Already have an account? Log In' : 'Don\'t have an account? Sign Up'}
      </Button>
    </div>
  );
}
