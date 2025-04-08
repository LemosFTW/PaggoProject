import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from '../page'; 
import { useAuth } from '@/hooks/useAuth'; 
import axios from 'axios'; 


jest.mock('@/hooks/useAuth');
const mockUseAuth = useAuth as jest.Mock; 

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>; 

jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
}));

const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('Home Page Component - Authentication Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
  });


  test('Testa se não renderiza nada se não autenticado após carregamento', () => {
     mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false, 
      isAuthenticated: false, 
      logout: jest.fn(),
    });

    const { container } = render(<Home />);
    expect(container.firstChild).toBeNull(); 
  });

   test('Testa a renderizaçao do layout principal quando autenticado e verifica chamada com token', async () => {
     mockUseAuth.mockReturnValue({
       user: { name: 'Test User', email: 'test@example.com', id: '1' },
       isLoading: false,
       isAuthenticated: true, 
       logout: jest.fn(),
     });
     localStorageMock.setItem('access_token', 'fake-token'); 

     mockedAxios.get.mockResolvedValue({ data: [] });

     render(<Home />);

     
     expect(screen.getByText(/armazenamento de arquivos/i)).toBeInTheDocument();
     expect(screen.getByText(/bem-vindo, Test User!/i)).toBeInTheDocument();
     expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
     expect(screen.getByRole('button', { name: /fazer upload de novo arquivo/i })).toBeInTheDocument();

     await waitFor(() => {
       expect(mockedAxios.get).toHaveBeenCalledWith(
         'http://localhost:3000/api/upload',
         expect.objectContaining({
           headers: { Authorization: 'Bearer fake-token' },
         })
       );
     });

     expect(screen.getByText(/nenhum arquivo encontrado/i)).toBeInTheDocument();
   });
});
