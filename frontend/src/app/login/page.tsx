"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
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
          const { access_token, refresh_token, user } = response.data;
      
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          localStorage.setItem('user', JSON.stringify(user)); 
          router.push('/');
      })
      .catch(error => {
        const arr = error.response.data.message;
        arr.forEach((error: any) => {
          console.log(error);
        });
      });
  }

  return (
    <>
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