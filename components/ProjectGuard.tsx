import React from 'react';
import ZiroedaLogo from './ZiroedaLogo';
import { Home, AlertCircle, Lock } from 'lucide-react';

export type InitializationStatus = 'initializing' | 'ready' | 'not-found' | 'unauthorized';

interface ProjectGuardProps {
    status: InitializationStatus;
    onLogin?: () => void;
    children: React.ReactNode;
}

const ProjectGuard: React.FC<ProjectGuardProps> = ({ status, onLogin, children }) => {
    if (status === 'ready') return <>{children}</>;

    const handleReturnHome = () => {
        window.location.href = 'https://ziroeda.com';
    };

    return (
        <div className="fixed inset-0 z-[200] bg-dark-900 flex items-center justify-center p-6 text-center">
            {/* Background Grain/Grid */}
            <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-dark-900/0 via-dark-900/80 to-dark-900 -z-10" />

            <div className="max-w-md w-full flex flex-col items-center gap-8 animate-in fade-in duration-500">
                {status === 'initializing' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <ZiroedaLogo className="w-24 h-24 relative z-10 animate-bounce transition-transform duration-1000" />
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <h2 className="text-2xl font-bold text-white tracking-tight">Initializing Ziro</h2>
                                <p className="text-zinc-400 font-mono text-sm animate-pulse italic">
                                    Connecting to your project workspace...
                                </p>
                            </div>
                            {onLogin && (
                                <button
                                    onClick={onLogin}
                                    className="mt-4 flex items-center justify-center gap-3 px-6 py-3 bg-white text-dark-900 rounded-xl font-bold hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/5 group"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign In to Save Progress
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {status === 'not-found' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Project Not Found</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                The project you're looking for doesn't exist or the link has expired.
                                Please start a new session from the main platform.
                            </p>
                        </div>
                        <button
                            onClick={handleReturnHome}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-dark-900 rounded-xl font-bold hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/5"
                        >
                            <Home className="w-4 h-4" />
                            Return to ZiroEDA
                        </button>
                    </div>
                )}

                {status === 'unauthorized' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-brand-500/10 rounded-full flex items-center justify-center border border-brand-500/20">
                            <Lock className="w-10 h-10 text-brand-500" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Unauthorized</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                This project is private. Please sign in to access your work or return home.
                            </p>
                        </div>
                        <div className="flex flex-col w-full gap-3">
                            {onLogin && (
                                <button
                                    onClick={onLogin}
                                    className="flex items-center justify-center gap-3 px-6 py-3 bg-white text-dark-900 rounded-xl font-bold hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/5 group"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign In with Google
                                </button>
                            )}
                            <button
                                onClick={handleReturnHome}
                                className="flex items-center justify-center gap-2 px-6 py-3 border border-dark-600 text-zinc-400 rounded-xl font-medium hover:bg-dark-800 transition-all"
                            >
                                <Home className="w-4 h-4" />
                                Return Home
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectGuard;
