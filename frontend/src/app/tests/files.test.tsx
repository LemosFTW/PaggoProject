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
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

describe('Testes para a lista de arquivos', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();

    mockUseAuth.mockReturnValue({
      user: { name: 'File Tester', id: '2', email: 'files@test.com' },
      isLoading: false,
      isAuthenticated: true,
      logout: jest.fn(),
    });
    localStorageMock.setItem('access_token', 'fake-file-token');
  });

  test('Testa a exibição da mensagem "Nenhum arquivo encontrado" quando a API retorna lista vazia', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(<Home />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'http://localhost:3000/api/upload',
        expect.objectContaining({
          headers: { Authorization: 'Bearer fake-file-token' },
        })
      );
    });

    expect(screen.getByText(/nenhum arquivo encontrado/i)).toBeInTheDocument();
  });

  test('exibe a lista de arquivos corretamente com nome, tamanho e data', async () => {
    const testDate = new Date();
    const mockFiles = [
      {
        id: 1,
        originalName: 'relatorio_final.pdf',
        size: 15360, // 15 KB
        createdAt: testDate.toISOString(),
        text: 'Conteúdo do PDF'
      },
      {
        id: 2,
        originalName: 'logo_empresa.png',
        size: 8192, // 8 KB
        createdAt: new Date(testDate.getTime() - 86400000).toISOString(), // Dia anterior
        text: 'Conteúdo da Imagem'
      },
    ];
    mockedAxios.get.mockResolvedValue({ data: mockFiles });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('relatorio_final.pdf')).toBeInTheDocument();
      expect(screen.getByText('logo_empresa.png')).toBeInTheDocument();
    });

    expect(screen.getByText('15 KB')).toBeInTheDocument();
    expect(screen.getByText('8 KB')).toBeInTheDocument();  
  });

  test('Testa a abertura do modal de detalhes ao clicar em um arquivo', async () => {
    const mockFiles = [
      { id: 1, originalName: 'arquivo_clicavel.pdf', size: 1024, createdAt: new Date().toISOString(), text: 'Texto do arquivo clicável' },
    ];
    mockedAxios.get.mockResolvedValue({ data: mockFiles });

    render(<Home />);
    const user = userEvent.setup();

    const fileElement = await screen.findByText('arquivo_clicavel.pdf');
    await user.click(fileElement); 

    expect(await screen.findByRole('heading', { name: /detalhes: arquivo_clicavel.pdf/i })).toBeInTheDocument();

    expect(screen.getByText('Texto do arquivo clicável')).toBeInTheDocument();

    expect(screen.getByPlaceholderText(/faça uma pergunta sobre o texto.../i)).toBeInTheDocument();
  });

  test('Testa a exibição do toast e fechamento do modal se o arquivo clicado não tiver texto extraído', async () => {
    const mockFiles = [
      { id: 1, originalName: 'arquivo_sem_texto.jpg', size: 2048, createdAt: new Date().toISOString(), text: '' }, 
    ];
    mockedAxios.get.mockResolvedValue({ data: mockFiles });

    render(<Home />);
    const user = userEvent.setup();

    const fileElement = await screen.findByText('arquivo_sem_texto.jpg');
    await user.click(fileElement);

    expect(await screen.findByText(/Nenhum texto extraído disponível para este arquivo./i)).toBeInTheDocument();

    await waitFor(() => {
       expect(screen.queryByRole('heading', { name: /detalhes: arquivo_sem_texto.jpg/i })).not.toBeInTheDocument();
    });
  });
});
