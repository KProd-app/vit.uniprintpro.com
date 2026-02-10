import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const variants = {
        success: "bg-green-50 border-green-200 text-green-800",
        error: "bg-red-50 border-red-200 text-red-800",
        info: "bg-blue-50 border-blue-200 text-blue-800"
    };

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-green-600" />,
        error: <XCircle className="w-5 h-5 text-red-600" />,
        info: <Info className="w-5 h-5 text-blue-600" />
    };

    return (
        <div className={cn(
            "flex items-center w-full max-w-xs p-4 rounded-lg shadow-md border animate-in slide-in-from-right-full fade-in duration-300",
            variants[type]
        )}>
            <div className="flex-shrink-0 mr-3">
                {icons[type]}
            </div>
            <div className="flex-1 text-sm font-medium">
                {message}
            </div>
            <button
                onClick={onClose}
                className="ml-3 inline-flex flex-shrink-0 justify-center items-center h-5 w-5 rounded-md hover:bg-black/5 focus:outline-none"
            >
                <X className="w-4 h-4 opacity-50" />
            </button>
        </div>
    );
};
