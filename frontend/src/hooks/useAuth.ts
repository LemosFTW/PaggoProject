import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
        router.push('/login');
    }
  }, [router]);

  const checkAuthStatus = useCallback(() => {
    setIsLoading(true);
    try {
        const accessToken = localStorage.getItem('access_token');
        const refreshToken = localStorage.getItem('refresh_token');
        const userString = localStorage.getItem('user');

        if (!accessToken || !refreshToken || !userString) {
            throw new Error('Credenciais não encontradas');
        }

        const parsedUser: User = JSON.parse(userString);
        setUser(parsedUser);
        setIsAuthenticated(true);

    } catch (error) {
        console.log("Verificação de Auth falhou:", (error as Error).message);
        if (isAuthenticated) {
           logout();
        } else {
           setUser(null);
           setIsAuthenticated(false);
        }
    } finally {
        setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return { user, isLoading, isAuthenticated, logout, checkAuthStatus };
}