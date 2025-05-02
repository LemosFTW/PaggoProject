"use client"
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {PrimaryButton} from '@/components/Button';


export default function AdminPage(){
    const router = useRouter();
    const { isAuthenticated, isLoading, logout } = useAuth();
    useEffect(() => {
        if (!isAuthenticated && !isLoading) 
            logout();
        //TODO block access to non-admin users
        
    }, [isAuthenticated, isLoading, router]);

    return(
        <div className="flex flex-col items-center justify-center min-h-screen py-8"> 
            <div className='text-center text-xl mb-4'>
                Bem vindo a pagina destinada a Administradores
            </div>
            <div className='flex justify-center items-center'> 
                <PrimaryButton className='bg-blue-500 text-white p-2 rounded' onClick={() => {
                    router.push('/admin/users');
                }}>
                    Usuários
                </PrimaryButton>
            </div>
        </div>
    )
}