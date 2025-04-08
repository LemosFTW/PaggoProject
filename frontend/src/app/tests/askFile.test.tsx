import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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

describe('Home Page Component - Ask File Functionality', () => {

  const mockFile = {
    id: 99,
    originalName: 'documento_para_perguntas.pdf',
    size: 2048,
    createdAt: new Date().toISOString(),
    text: 'Este é o conteúdo do documento sobre o qual faremos perguntas.'
  };

  const setup = async () => {
    mockUseAuth.mockReturnValue({
      user: { name: 'Asker User', id: '3', email: 'asker@test.com' },
      isLoading: false,
      isAuthenticated: true,
      logout: jest.fn(),
    });
    localStorageMock.setItem('access_token', 'fake-ask-token');

    mockedAxios.get.mockResolvedValue({ data: [mockFile] });

    render(<Home />);
    const user = userEvent.setup();

    const fileElement = await screen.findByText(mockFile.originalName);
    await user.click(fileElement);

    await screen.findByRole('heading', { name: `Detalhes: ${mockFile.originalName}` });

    return { user }; 
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
  });

  test('Testa a impedição do envio se o token de autenticação estiver faltando', async () => {
    const { user } = await setup();
    const question = 'Pergunta sem token?';

    localStorageMock.removeItem('access_token');

    const textarea = screen.getByPlaceholderText(/faça uma pergunta sobre o texto.../i);
    await user.type(textarea, question);
    const submitButton = screen.getByRole('button', { name: /enviar pergunta/i });
    await user.click(submitButton);

    expect(mockedAxios.post).not.toHaveBeenCalled();

    const errorMessages = await screen.findAllByText(/Erro de autenticação. Faça login novamente./i);
    expect(errorMessages.length).toBeGreaterThanOrEqual(1);

    expect(mockUseAuth().logout).toHaveBeenCalledTimes(1);

    expect(submitButton).toBeEnabled();

    let resolvePost: (value: unknown) => void;
    mockedAxios.post.mockImplementationOnce(() => new Promise(resolve => {
        resolvePost = resolve;
    }));
  });
});
