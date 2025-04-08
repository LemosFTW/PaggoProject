"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SuccessToast, ErrorToast } from '@/components/Toast';

interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, type: 'success' | 'error', duration?: number) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
  };
  
  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
    }
    axios.post('http://localhost:3000/auth/login', payload)
      .then(response => {
          console.log('Registro bem-sucedido:', response.data);
          addToast('Login bem-sucedido', 'success');
          const { access_token, refresh_token, user } = response.data;
      
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          localStorage.setItem('user', JSON.stringify(user)); 
          router.push('/');
      })
      .catch(error => {
        const arr = error.response.data.message;
        console.log(arr);
        if (typeof arr === 'string') {
          addToast(arr, 'error');
        } else {
          arr.forEach((error: any) => {
            console.log(error);
            addToast(error, 'error');
          });
        }
      });
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          toast.type === 'success' ? (
            <SuccessToast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              onClose={() => removeToast(toast.id)}
              duration={toast.duration}
            />
          ) : (
            <ErrorToast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              onClose={() => removeToast(toast.id)}
              duration={toast.duration}
            />
          )
        ))}
      </div>

      <div className='flex flex-col items-center justify-center min-h-screen'>
        <h1 className='text-2xl font-bold px-1 py-2'>Login</h1>
        <form onSubmit={handleLogin} className='flex flex-col gap-2'>
          <input type="email" name="email" placeholder="Email" className='p-2 m-2 rounded-md' />
          <input type="password" name="password" placeholder="Password" className='p-2 m-2 rounded-md' />
          <button className='bg-blue-500 text-white p-2 m-2 rounded-md max-w-xs w-full animate-pulse hover:animate-none cursor-pointer' type="submit">Login</button>
        </form>
        <span className='text-center'>Não tem conta? <a href="/register" className='text-blue-500'>Registre-se</a></span>
      </div>
    </>
  );
}