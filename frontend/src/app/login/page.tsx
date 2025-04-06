"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function LoginPage() {
  const router = useRouter();
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
  return (
    <>
    <div>
      <h1 className='text-2xl font-bold'>Login</h1>
      <form onSubmit={handleLogin}>
        <input type="email" name="email" placeholder="Email" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    </div>
    </>
  );
} 
}