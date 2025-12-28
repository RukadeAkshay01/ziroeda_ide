import React, { useState, useEffect, useRef } from 'react';
import { ProjectVersion } from '../services/supabase';
import { History, RotateCcw, Plus, Clock, X, GripHorizontal } from 'lucide-react';

interface VersionHistoryPanelProps {
    versions: ProjectVersion[];
    onCreateVersion: (name: string) => Promise<void>;
    onLoadVersion: (version: ProjectVersion) => void;
    isLoading: boolean;
    onClose: () => void;
    isReadOnly?: boolean;
}

const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
    versions,
    onCreateVersion,
    onLoadVersion,
    isLoading,
    onClose,
    isReadOnly = false
}) => {
    const [newVersionName, setNewVersionName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Floating Window State
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0 });

    // Initialize position (center screen)
    useEffect(() => {
        const width = 384; // w-96
        const height = 500;
        setPosition({
            x: Math.max(0, (window.innerWidth - width) / 2),
            y: Math.max(20, (window.innerHeight - height) / 2)
        });
    }, []);

    // Dragging Logic
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragStart.current.x,
                    y: e.clientY - dragStart.current.y
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    const handleCreate = async () => {
        if (!newVersionName.trim()) return;
        setIsCreating(true);
        try {
            await onCreateVersion(newVersionName);
            setNewVersionName('');
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div
            className="fixed z-[95] w-96 bg-dark-900 rounded-xl border border-dark-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
            style={{ left: position.x, top: position.y, height: '500px' }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b border-dark-700 bg-dark-800 cursor-move select-none"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-3">
                    <GripHorizontal className="w-5 h-5 text-gray-500" />
                    <div className="bg-brand-500/10 p-1.5 rounded-lg">
                        <History className="w-4 h-4 text-brand-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider leading-none">History</h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase mt-1">Project Snapshots</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-500 rounded-lg text-gray-500 transition-all"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Create Version Form */}
            <div className="p-4 border-b border-dark-700 bg-dark-800/50">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Create Snapshot</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Version name (e.g. 'Added LED')"
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                        disabled={isReadOnly}
                        className="flex-1 bg-dark-900 border border-dark-600 rounded px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-brand-500/50 transition-colors"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newVersionName.trim() || isCreating || isReadOnly}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Add</span>
                    </button>
                </div>
            </div>

            {/* Version List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-dark-900 scrollbar-hide">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                        <span className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">Loading history...</span>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center p-4">
                        <History className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-sm font-medium">No snapshots yet</p>
                        <p className="text-xs opacity-60">Create a snapshot to handle version control.</p>
                    </div>
                ) : (
                    versions.map((version, index) => (
                        <div
                            key={version.id}
                            className="group bg-dark-800/50 border border-dark-700/50 hover:border-dark-600 rounded-lg p-3 transition-all hover:bg-dark-800"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${index === 0 ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-dark-700 text-gray-400'
                                        }`}>
                                        v{version.version_number}
                                    </div>
                                    <span className="font-medium text-xs text-gray-200 line-clamp-1" title={version.commit_message}>
                                        {version.commit_message}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(version.created_at)}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-dark-700/50">
                                <span className="text-[10px] text-gray-600 font-mono">
                                    {/* Placeholder for future diff stats or similar */}
                                    ID: {version.id.slice(0, 6)}
                                </span>
                                <button
                                    onClick={() => !isReadOnly && onLoadVersion(version)}
                                    disabled={isReadOnly}
                                    className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors border border-dark-700 ${isReadOnly ? 'text-gray-600 bg-dark-800 cursor-not-allowed opacity-50' : 'text-gray-400 hover:text-brand-400 bg-dark-900 hover:bg-dark-700'}`}
                                >
                                    <RotateCcw className="w-3 h-3" />
                                    Restore
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-dark-700 bg-dark-800 flex items-center justify-between text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                <span>Total: {versions.length}</span>
                <span className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                    Sync Active
                </span>
            </div>
        </div>
    );
};

export default VersionHistoryPanel;
