import { useState, useEffect, useRef } from 'react';
import { saveProject, updateProject, ProjectData } from '../services/supabase';
import { User } from 'firebase/auth';

interface UseAutosaveProps {
    components: any[];
    connections: any[];
    code: string;
    user: User | null;
    projectId: string | null;
    setProjectId: (id: string) => void;
    projectName: string;
    messages: any[];
    isPublic?: boolean;
    isReadOnly?: boolean;
}

export const useAutosave = ({
    components,
    connections,
    code,
    user,
    projectId,
    setProjectId,
    projectName,
    messages,
    isPublic = false,
    isReadOnly = false
}: UseAutosaveProps) => {
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

    // Ref to track if it's the initial mount to avoid saving on load
    const isFirstRender = useRef(true);

    // Ref to store the timeout ID
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!user) return;
        if (isReadOnly) return;

        // Set status to unsaved/saving pending
        setSaveStatus('saving');

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout (Debounce 2 seconds)
        timeoutRef.current = setTimeout(async () => {
            try {
                const projectData: ProjectData = {
                    name: projectName || "Untitled Project",
                    description: "Autosaved project",
                    owner_id: user.uid,
                    owner_name: user.displayName || "Anonymous",
                    is_public: isPublic,
                    chat_history: messages,
                    design: {
                        components,
                        connections,
                        code
                    }
                };

                if (projectId) {
                    // Update existing project
                    await updateProject(projectId, projectData);
                } else {
                    // Create new project
                    const result = await saveProject(projectData);
                    if (result && result.length > 0) {
                        setProjectId(result[0].id);
                    }
                }

                setSaveStatus('saved');
                setLastSavedAt(new Date());
            } catch (error) {
                console.error("Autosave failed:", error);
                setSaveStatus('error');
            }
        }, 2000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [components, connections, code, user, projectId, projectName, messages, isPublic, isReadOnly]); // Dependencies that trigger save

    return { saveStatus, lastSavedAt };
};
