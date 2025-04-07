"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface FileData {
  id: string | number;
  filename: string;
}

export default function Home() {
  const router = useRouter();
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const access_token = localStorage.getItem('access_token');
    const refresh_token = localStorage.getItem('refresh_token');
    const userString = localStorage.getItem('user');

    if (!access_token || !refresh_token || !userString) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userString);
      setUser(parsedUser);
    } catch (e) {
      console.error("Erro ao parsear dados do usuário:", e);
      localStorage.clear();
      router.push('/login');
      return;
    }

    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<FileData[]>('http://localhost:3000/api/upload', { // Use a interface FileData[]
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });
        setFiles(response.data);
        console.log('Arquivos recebidos:', response.data);
      } catch (err: any) {
        console.error("Erro ao buscar arquivos:", err);
        if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
           setError("Sessão expirada ou inválida. Por favor, faça login novamente.");
           localStorage.removeItem('access_token');
           localStorage.removeItem('refresh_token');
           localStorage.removeItem('user');
           router.push('/login');
        } else {
           setError('Falha ao carregar a lista de arquivos.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [router]);

  const handleUploadClick = () => {
    router.push('/upload');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  if (loading) {
    return <div>Carregando arquivos...</div>;
  }

  if (!user) {
     return null;
   }

  return (
    <div>
      <h1>Meus Arquivos</h1>
      <p>Bem-vindo, {user?.name || 'Usuário'}!</p>

      {error && <p style={{ color: 'red' }}>Erro: {error}</p>}

      {files.length > 0 ? (
        <ul>
          {files.map((file) => (
            <li key={file.id}>
              {file.filename}
            </li>
          ))}
        </ul>
      ) : (
        !error && <p>Nenhum arquivo encontrado.</p> 
      )}

      <button onClick={handleUploadClick}>Fazer Upload de Novo Arquivo</button>
      <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
    </div>
  );
}