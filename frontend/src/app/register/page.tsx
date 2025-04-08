"use client";
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SuccessToast, ErrorToast } from '@/components/Toast';

// Interface para o estado dos toasts
interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

export default function RegisterPage() {
  const router = useRouter();
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = (message: string, type: 'success' | 'error', duration?: number) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
  };
  
  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token'); 
    const userString = localStorage.getItem('user');

    if (access_token && refresh_token && userString) {
      router.push('/');
    }
  }, [router]);

  const handleRegister = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
    }
    axios.post('http://localhost:3000/auth/register', payload)
      .then(response => {
        console.log('Registro bem-sucedido:', response.data);
        addToast('Registro bem-sucedido!', 'success');
        const { access_token, refresh_token, user } = response.data;
    
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(user)); 
        setTimeout(() => router.push('/'), 1000);
      })
      .catch(error => {
        const messages = error.response?.data?.message;
        console.error("Erro no registro:", messages);
        if (typeof messages === 'string') {
          addToast(messages, 'error');
        } else if (Array.isArray(messages)) {
          messages.forEach((msg: string) => {
            addToast(msg, 'error');
          });
        } else {
          addToast('Ocorreu um erro desconhecido.', 'error');
        }
      });
  };
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
        <h1 className='text-2xl font-bold px-1 py-2'>Register</h1>
        <form onSubmit={handleRegister} className='flex flex-col gap-2'>
          <input type="text" name="name" placeholder="Name" className='p-2 m-2 rounded-md' />
          <input type="email" name="email" placeholder="Email" className='p-2 m-2 rounded-md' />
          <input type="password" name="password" placeholder="Password" className='p-2 m-2 rounded-md' />
          <button type="submit" className='bg-blue-500 text-white p-2 m-2 rounded-md max-w-xs w-full animate-pulse hover:animate-none cursor-pointer'>Register</button>
        </form>
        <span className='text-center'>Já tem conta? <a href="/login" className='text-blue-500'>Login</a></span>
      </div>
    </>
  );
} 