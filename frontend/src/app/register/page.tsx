"use client";
import axios from 'axios';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';


export default function RegisterPage() {
  useEffect(() => {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token'); 
    const userString = localStorage.getItem('user');

    if (access_token && refresh_token && userString) {
      router.push('/');
      return;
    }
    })

  const router = useRouter();
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
  };
  return (
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
  );
} 