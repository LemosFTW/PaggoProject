"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import axios from 'axios';
import { API_BASE_URL } from "@/config/enviroment";
import { useEffect, useState } from "react";

export default function UsersPage(){
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { 
            router.push('/login');
            return; 
        }
        
        axios.get(`${API_BASE_URL}/api/users`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              .then(response => {
                  setUsers(response.data);
              })
              .catch(error => {
                  console.error("Error fetching users:", error);
              });

    }, []); 

    return(
    <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-black text-white"> 
        <h1 className="text-2xl font-bold mb-6 text-white">Lista de Usuários</h1>
        {isLoading ? (
            <p className="text-white">Carregando...</p>
        ) : users.length > 0 ? (
            <div className="w-full max-w-4xl overflow-x-auto">
                <table className="min-w-full bg-gray-900 border border-gray-700 shadow-md rounded-lg">
                    <thead className="bg-gray-800">
                        <tr>
                            <th className="py-3 px-4 border-b border-gray-700 text-left text-sm font-semibold text-gray-300">Nome</th>
                            <th className="py-3 px-4 border-b border-gray-700 text-left text-sm font-semibold text-gray-300">Email</th>
                            <th className="py-3 px-4 border-b border-gray-700 text-left text-sm font-semibold text-gray-300">Role</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-700">
                                <td className="py-3 px-4 border-b border-gray-700 text-sm text-gray-200">{user.name}</td>
                                <td className="py-3 px-4 border-b border-gray-700 text-sm text-gray-200">{user.email}</td>
                                <td className="py-3 px-4 border-b border-gray-700 text-sm text-gray-200">{user.role}</td>
                            </tr>
                        ))}    
                    </tbody>
                </table>
            </div>
            ) : (
                <div className='text-center text-xl text-gray-400 mt-8'>
                    Nenhum usuário encontrado
                </div>
            )}
    </div>
)
}