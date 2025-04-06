"use client";
import axios from 'axios';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
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
    <div>
      <h1>Register</h1>
      <form onSubmit={handleRegister}>
        <input type="text" name="name" placeholder="Name" />
        <input type="email" name="email" placeholder="Email" />
        <input type="password" name="password" placeholder="Password" />
        <button type="submit">Register</button>
      </form>
    </div>
  );
} 