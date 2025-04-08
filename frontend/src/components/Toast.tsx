import React, { useEffect } from 'react';

interface ToastProps {
    id: number;
    message: string;
    duration?: number;
    onClose: (id: number) => void;
}

export const SuccessToast: React.FC<ToastProps> = ({ id, message, duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose, id]);

    return (
        <div className="bg-green-500 text-white px-4 py-2 rounded-md shadow-lg fixed top-4 right-4 z-50 animate-bounce ease-in-out flex items-center">
            <span className="flex-grow mr-2">{message}</span>
            <button
                onClick={() => onClose(id)}
                className="ml-2 text-black hover:text-gray-200 flex-shrink-0"
            >
                ✕
            </button>
        </div>
    );
};

export const ErrorToast: React.FC<ToastProps> = ({ id, message, duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose, id]);

    return (
        <div className="bg-red-500 text-white px-4 py-2 rounded-md shadow-lg  animate-toast flex items-center">
            <span className="flex-grow mr-2">{message}</span>
            <button
                onClick={() => onClose(id)}
                className="ml-2 text-black hover:text-gray-200 flex-shrink-0"
            >
                ✕
            </button>
        </div>
    );
};
