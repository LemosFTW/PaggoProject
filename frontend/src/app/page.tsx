"use client";

import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { SuccessToast, ErrorToast } from '@/components/Toast';
import { LoggedOutButton, UploadButton } from '@/components/Button';
interface ToastData {
  id: number;
  message: string;
  type: 'success' | 'error';
  duration?: number;
}

interface FileData {
  id: string | number;
  filename: string;
  originalName: string;
  size: number;
  createdAt: string;
  text: string;
  mimeType?: string;
  url?: string;
}

interface ConversationItem {
    question: string;
    answer: string;
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
function formatDate(dateString: string): string {
  try {
    if (!dateString || typeof dateString !== 'string' || dateString.length < 10) {
        return 'Data inválida';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return 'Data inválida';
    }
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Data inválida';
  }
}

export default function Home() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAuthenticated, logout } = useAuth();

  const [toasts, setToasts] = useState<ToastData[]>([]);

  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedFileForModal, setSelectedFileForModal] = useState<FileData | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [askError, setAskError] = useState<string | null>(null);

  const addToast = (message: string, type: 'success' | 'error', duration?: number) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
  };

  const removeToast = (id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  const fetchFiles = useCallback(async () => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error("Token não encontrado para fetchFiles");
        logout();
        addToast('Token não encontrado. Faça login novamente.', 'error');
        return;
    }

    setIsLoadingFiles(true);
    setError(null);
    try {
      const response = await axios.get<FileData[]>('http://localhost:3000/api/upload', {
        headers: {
          'Authorization': `Bearer ${token}`}
      });
      setFiles(response.data);
      console.log('Arquivos recebidos:', response.data);
    } catch (err: any) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
         console.error("Erro 401 ao buscar arquivos. Deslogando.");
         logout();
         addToast('Erro 401: Sessão expirada. Faça login novamente.', 'error');
      } else {
         console.error("Erro ao buscar arquivos:", err);
         setError('Falha ao carregar a lista de arquivos.');
         addToast('Falha ao carregar a lista de arquivos.', 'error');
      }
    } finally {
      setIsLoadingFiles(false);
    }
  }, [isAuthenticated, logout]);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated, isAuthLoading, fetchFiles]);

  const handleUploadClick = () => {
    setSelectedFile(null);
    setUploadError(null);
    setIsModalOpen(true);
  };
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadError(null);
    }
  };

  const handleActualUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setUploadError("Por favor, selecione um arquivo.");
      addToast('Por favor, selecione um arquivo.', 'error');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setUploadError("Erro de autenticação. Por favor, faça login novamente.");
      addToast('Erro de autenticação. Por favor, faça login novamente.', 'error');
      logout();
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    if (selectedFile.type !== 'application/pdf' && selectedFile.type !== 'image/png' && selectedFile.type !== 'image/jpeg') {
      setUploadError("O arquivo deve ser PDF, PNG ou JPG.");
      addToast('O arquivo deve ser PDF, PNG ou JPG.', 'error');
      setIsUploading(false);
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/upload', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsModalOpen(false);
      setSelectedFile(null);
      await fetchFiles();
      addToast('Arquivo enviado com sucesso.', 'success');
    } catch (err: any) {
        console.error("Erro no upload:", err);
        let errorMessage = 'Falha no upload do arquivo. Verifique sua conexão.';
        if (axios.isAxiosError(err) && err.response?.status === 401) {
            errorMessage = "Sessão expirada. Faça login novamente.";
            setUploadError(errorMessage);
            logout();
        } else if (axios.isAxiosError(err) && err.response) {
            errorMessage = err.response.data?.message || 'Falha no upload do arquivo.';
            setUploadError(errorMessage);
         } else {
            setUploadError(errorMessage);
         }
         addToast(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileClick = (file: FileData) => {
    setSelectedFileForModal(file);
    setConversation([]);
    setCurrentQuestion("");
    setAskError(null);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedFileForModal(null);
  };

  const handleQuestionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentQuestion(event.target.value);
  };

  const handleAskSubmit = async (event: FormEvent<HTMLFormElement>) => {
     event.preventDefault();
     if (!currentQuestion.trim() || isAsking || !selectedFileForModal) {
         console.log("Ask submit blocked:", { currentQuestion, isAsking, selectedFileForModal });
         return;
     }

     const token = localStorage.getItem('access_token');
     if (!token) {
         setAskError("Erro de autenticação. Faça login novamente.");
         logout();
         addToast('Erro de autenticação. Faça login novamente.', 'error');
         return;
     }

     setIsAsking(true);
     setAskError(null);
     const questionToSend = currentQuestion;

     try {
         const response = await axios.post<string>(
             `http://localhost:3000/api/upload/${selectedFileForModal.id}/ask`,
             { question: questionToSend },
             { headers: { 'Authorization': `Bearer ${token}` } }
         );
         console.log('resposta recebida:', response.data);
         const answerString = response.data;
         addToast('Resposta recebida com sucesso.', 'success');

         setConversation(prev => [...prev, { question: questionToSend, answer: answerString }]);
         setCurrentQuestion("");

     } catch (err: any) {
         console.error("Erro ao perguntar:", err);
         let askErrorMessage = 'Erro de comunicação com o servidor ao enviar pergunta.';
         if (axios.isAxiosError(err) && err.response?.status === 401) {
             askErrorMessage = "Sessão expirada ou inválida. Faça login novamente.";
             setAskError(askErrorMessage);
             logout();
         } else if (axios.isAxiosError(err) && err.response) {
             const apiErrorMessage = err.response.data?.message || err.response.data?.error;
             askErrorMessage = apiErrorMessage || `Erro ao processar pergunta: ${err.response.statusText}`;
             setAskError(askErrorMessage);
         } else {
             setAskError(askErrorMessage);
         }
         addToast(askErrorMessage, 'error');

     } finally {
         setIsAsking(false);
     }
  };

  const handleDownloadConversation = () => {
    if (!selectedFileForModal) return;

    let conversationText = "--- CONVERSA ---\n\n";
    conversation.forEach((item, index) => {
        conversationText += `[${index + 1}] Pergunta: ${item.question}\n`;
        conversationText += `    Resposta: ${item.answer}\n\n`;
    });

    const combinedText = `--- TEXTO ORIGINAL DO ARQUIVO ---\n\n${selectedFileForModal.text || "(Nenhum texto extraído)"}\n\n\n${conversationText}`;

    const blob = new Blob([combinedText], { type: 'text/plain;charset=utf-8' });

    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const safeOriginalName = selectedFileForModal.originalName.replace(/[^a-z0-9_.-]/gi, '_');
    link.download = `${safeOriginalName}_conversa.txt`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  if (isAuthLoading) {
    return <div className="flex items-center justify-center min-h-screen">Verificando autenticação...</div>;
  }

  if (!isAuthenticated) {
     return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white relative">
       <div className="fixed top-4 right-4 z-[100] space-y-2 w-80">
         {toasts.map((toast) => (
            toast.type === 'success' ? (
              <SuccessToast
                key={toast.id}
                id={toast.id}
                message={toast.message}
                duration={toast.duration}
                onClose={removeToast}
              />
            ) : (
              <ErrorToast
                key={toast.id}
                id={toast.id}
                message={toast.message}
                duration={toast.duration}
                onClose={removeToast}
              />
            )
         ))}
       </div>

       <div className="flex items-center p-4 border-b border-gray-700">
           <h1 className="text-xl font-bold">Armazenamento de Arquivos</h1>
           <div className="flex items-center ml-auto gap-4">
               <p className="text-base font-semibold">Bem-vindo, {user?.name || 'Usuário'}!</p>
               <LoggedOutButton
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm transition duration-150 ease-in-out"
               >
                   Logout
               </LoggedOutButton>
           </div>
       </div>

       <div className="flex flex-col items-center flex-grow pt-8 pb-8 px-4">
         {isLoadingFiles && <p className="mb-4">Carregando lista de arquivos...</p>}
         {error && <p className="text-red-500 mb-4">Erro: {error}</p>}

         {!isLoadingFiles && files.length > 0 ? (
            <div className="w-full max-w-2xl mb-8">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 mb-3 bg-gray-800 rounded-md border border-gray-700 hover:bg-gray-700 transition duration-150 ease-in-out cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <div className="flex-1 mr-4 overflow-hidden">
                    <p className="text-base font-medium text-blue-400 truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right text-sm text-gray-400">
                    <p>{formatBytes(file.size)}</p>
                    <p>{formatDate(file.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isLoadingFiles && !error && <p className="mb-8">Nenhum arquivo encontrado.</p>
          )}

         <div className="flex flex-col sm:flex-row gap-4">
            <UploadButton
                onClick={handleUploadClick}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out"
                disabled={isUploading}
            >
                Fazer Upload de Novo Arquivo
            </UploadButton>
          </div>
       </div>

        {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-white">Upload de Arquivo</h2>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            disabled={isUploading}
                            className="text-gray-400 hover:text-white text-2xl disabled:opacity-50"
                        >
                            &times;
                        </button>
                    </div>
                    <form onSubmit={handleActualUpload}>
                        <div className="mb-4">
                            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-1">
                                Selecionar arquivo
                            </label>
                            <input
                                id="file-upload"
                                name="file-upload"
                                type="file"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                disabled={isUploading}
                            />
                             {selectedFile && <p className="text-xs text-gray-400 mt-1 truncate">Selecionado: {selectedFile.name}</p>}
                        </div>

                        {uploadError && (
                            <p className="text-red-500 text-sm mb-4">{uploadError}</p>
                        )}

                        <button
                            type="submit"
                            disabled={!selectedFile || isUploading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? 'Enviando...' : 'Enviar Arquivo'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {isDetailModalOpen && selectedFileForModal && (
             <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] flex flex-col text-white">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700 flex-shrink-0">
                        <h2 className="text-xl font-semibold truncate" title={selectedFileForModal.originalName}>
                            Detalhes: {selectedFileForModal.originalName}
                        </h2>
                        <button
                            onClick={handleCloseDetailModal}
                            className="text-gray-400 hover:text-white text-2xl disabled:opacity-50"
                            disabled={isAsking}
                            aria-label="Fechar modal de detalhes"
                        >
                            &times;
                        </button>
                    </div>

                    <div className="flex-grow overflow-y-auto mb-4 pr-2 space-y-6">
                         <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Texto Extraído:</h3>
                            <pre className="bg-gray-900 p-3 rounded text-sm text-gray-200 whitespace-pre-wrap break-words max-h-60 overflow-y-auto border border-gray-700">
                                {selectedFileForModal.text ? selectedFileForModal.text.replaceAll('/n', '\n') : (
                                  (() => {
                                    addToast('Nenhum texto extraído disponível para este arquivo.', 'error');
                                    handleCloseDetailModal();
                                    return null;
                                  })()
                                )}
                            </pre>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-300 mb-2">Conversa:</h3>
                            {conversation.length === 0 && !isAsking && <p className="text-sm text-gray-400 italic">Faça uma pergunta sobre o texto acima.</p>}
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                {conversation.map((item, index) => (
                                    <div key={index} className="text-sm">
                                        <p className="font-medium text-blue-400 mb-1">Você:</p>
                                        <p className="bg-gray-700 p-2 rounded whitespace-pre-wrap break-words">{item.question}</p>
                                        <p className="font-medium text-green-400 mt-2 mb-1">Resposta:</p>
                                        <p className="bg-gray-700 p-2 rounded whitespace-pre-wrap break-words">{item.answer}</p>
                                    </div>
                                ))}
                                {isAsking && <p className="text-sm text-yellow-400 italic mt-2">Pensando...</p>}
                            </div>
                        </div>
                         {askError && (
                            <p className="text-red-500 text-sm mt-2 font-medium">{askError}</p>
                         )}
                    </div>

                    <form onSubmit={handleAskSubmit} className="mt-auto flex-shrink-0 pt-4 border-t border-gray-700">
                        <textarea
                            id="question-input"
                            rows={3}
                            value={currentQuestion}
                            onChange={handleQuestionChange}
                            placeholder="Faça uma pergunta sobre o texto..."
                            disabled={isAsking}
                            className="block w-full bg-gray-700 border border-gray-600 rounded-md p-2 mb-3 text-sm text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:opacity-70"
                        />
                        <div className="flex items-center justify-end gap-3">
                             <button
                                type="button"
                                onClick={handleDownloadConversation}
                                disabled={isAsking}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50"
                            >
                                Download
                            </button>
                            <button
                                type="submit"
                                disabled={!currentQuestion.trim() || isAsking}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAsking ? 'Enviando...' : 'Enviar Pergunta'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
}