
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = 'warning'
}) => {
    if (!isOpen) return null;

    const colors = {
        danger: { icon: 'text-red-500', button: 'bg-red-500 hover:bg-red-600', border: 'border-red-500/20' },
        warning: { icon: 'text-orange-500', button: 'bg-orange-500 hover:bg-orange-600', border: 'border-orange-500/20' },
        info: { icon: 'text-brand-400', button: 'bg-brand-500 hover:bg-brand-600', border: 'border-brand-500/20' }
    };

    const color = colors[type];

    const [isLoading, setIsLoading] = React.useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
        } finally {
            setIsLoading(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            />

            {/* Modal Content */}
            <div className={`relative bg-dark-900 border ${color.border} rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full bg-dark-800 ${color.icon}`}>
                        <AlertTriangle className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-100 mb-2">
                            {title}
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {!isLoading && (
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-dark-800 transition-colors font-medium text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 rounded-lg text-white font-medium text-sm transition-all shadow-lg ${color.button} ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                    >
                        {isLoading ? 'Saving...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
