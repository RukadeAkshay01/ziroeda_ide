import React, { useState } from 'react';
import { signInWithGoogle } from '../services/firebase';
import ZiroedaLogo from './ZiroedaLogo';

interface LoginOverlayProps {
    onLoginSuccess?: () => void;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onLoginSuccess }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            onLoginSuccess?.();
        } catch (err: any) {
            console.error(err);
            setError("Failed to sign in. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Blurred Background Layer */}
            <div
                className="absolute inset-0 bg-dark-900/40 backdrop-blur-sm transition-all duration-500"
                style={{ backdropFilter: 'blur(8px)' }}
            />

            {/* Login Card */}
            <div className="relative z-10 bg-dark-800/90 border border-dark-600 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">

                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                        <ZiroedaLogo className="w-10 h-10 text-brand-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to ZiroEDA</h1>
                    <p className="text-zinc-400 text-center text-sm">
                        Sign in to access your intelligent circuit design environment.
                    </p>
                </div>

                {error && (
                    <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            <span>Sign in with Google</span>
                        </>
                    )}
                </button>

                <div className="text-xs text-zinc-500 text-center mt-2">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </div>
            </div>
        </div>
    );
};

export default LoginOverlay;
