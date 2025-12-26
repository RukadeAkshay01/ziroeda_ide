import React from 'react';
import ZiroedaLogo from './ZiroedaLogo';
import { Home, AlertCircle, Lock } from 'lucide-react';

export type InitializationStatus = 'initializing' | 'ready' | 'not-found' | 'unauthorized' | 'validating';

interface ProjectGuardProps {
    status: InitializationStatus;
    children: React.ReactNode;
}

const ProjectGuard: React.FC<ProjectGuardProps> = ({ status, children }) => {
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
                {(status === 'initializing' || status === 'validating') && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <ZiroedaLogo className="w-24 h-24 relative z-10 animate-bounce transition-transform duration-1000" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                {status === 'initializing' ? 'Initializing Ziro' : 'Validating Session'}
                            </h2>
                            <p className="text-zinc-400 font-mono text-sm animate-pulse italic">
                                {status === 'initializing' ? 'Connecting to your project workspace...' : 'Synchronizing with Ziro Portal...'}
                            </p>
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
                            <h2 className="text-2xl font-bold text-white tracking-tight">Authentication Required</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed text-center">
                                To protect your work, this project requires a valid session.
                                <br />
                                <span className="text-brand-400 animate-pulse mt-2 block font-medium">Redirecting to Ziro Portal...</span>
                            </p>
                        </div>
                        <div className="flex flex-col w-full gap-3">
                            <button
                                onClick={handleReturnHome}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-dark-900 rounded-xl font-bold hover:bg-zinc-200 transition-all shadow-lg"
                            >
                                <Home className="w-4 h-4" />
                                Go to Main Website
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectGuard;
