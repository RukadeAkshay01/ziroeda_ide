import { createClient } from '@supabase/supabase-js';
import { MAINTENANCE_MODE } from '../maintenanceConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ProjectData {
    name: string;
    description?: string;
    owner_id: string;
    owner_name?: string;
    is_public?: boolean;
    public_access?: 'private' | 'view' | 'edit';
    tags?: string[];
    chat_history?: any[];
    design: {
        components: any[];
        connections: any[];
        code: string;
    };
    preview_url?: string;
}

export const uploadProjectPreview = async (projectId: string, blob: Blob): Promise<string | null> => {
    try {
        if (MAINTENANCE_MODE) {
            console.log("[Maintenance] Skipping uploadProjectPreview");
            return "https://placehold.co/600x400?text=Maintenance+Mode";
        }

        const timestamp = Date.now();
        const fileName = `${projectId}_${timestamp}.png`;

        // 1. Cleanup old previews for this project to save storage
        const { data: listData } = await supabase.storage
            .from('project_previews')
            .list('', { search: projectId });

        if (listData && listData.length > 0) {
            const filesToRemove = listData.map(f => f.name);
            await supabase.storage
                .from('project_previews')
                .remove(filesToRemove);
        }

        // 2. Upload new preview with unique name
        const { error } = await supabase.storage
            .from('project_previews')
            .upload(fileName, blob, {
                contentType: 'image/png',
                upsert: false // New file, so no upsert needed
            });

        if (error) {
            console.error('Error uploading preview:', error);
            return null;
        }

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('project_previews')
            .getPublicUrl(fileName);

        return publicUrl;

    } catch (e) {
        console.error("Upload exception:", e);
        return null;
    }
};

export interface ProjectVersion {
    id: string;
    project_id: string;
    version_number: number;
    created_at: string;
    design: {
        components: any[];
        connections: any[];
        code: string;
    };
    preview_url?: string;
    commit_message?: string;
}

export const saveProject = async (project: ProjectData) => {
    if (MAINTENANCE_MODE) {
        console.log("[Maintenance] Skipping saveProject", project);
        return [{ id: 'maintenance-mock-id', ...project }];
    }
    const { data, error } = await supabase
        .from('projects')
        .insert([
            {
                name: project.name,
                description: project.description,
                owner_id: project.owner_id,
                owner_name: project.owner_name,
                is_public: project.is_public || false,
                public_access: project.public_access || 'private',
                tags: project.tags || [],
                chat_history: project.chat_history || [],
                design: project.design,
                preview_url: project.preview_url
            }
        ])
        .select();

    if (error) {
        console.error("Error saving project:", error);
        throw error;
    }
    return data;
};

export const updateProject = async (projectId: string, project: Partial<ProjectData>) => {
    if (MAINTENANCE_MODE) {
        console.log("[Maintenance] Skipping updateProject", projectId, project);
        return [{ id: projectId, ...project }];
    }
    const { data, error } = await supabase
        .from('projects')
        .update({
            ...project,
            updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select();

    if (error) {
        console.error("Error updating project:", error);
        throw error;
    }
    return data;
};



export const loadProject = async (projectId: string) => {
    if (MAINTENANCE_MODE) {
        console.log("[Maintenance] Skipping loadProject", projectId);
        return null; // Return null to simulate "new project" or handle gracefully
    }
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

    if (error) {
        console.error("Error loading project:", error);
        throw error;
    }
    return data;
};

export const loadProjects = async (userId: string) => {
    if (MAINTENANCE_MODE) {
        console.log("[Maintenance] Skipping loadProjects for user", userId);
        return [];
    }
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error("Error loading projects:", error);
        throw error;
    }
    return data;
};

export const fetchProjectVersions = async (projectId: string) => {
    if (MAINTENANCE_MODE) {
        console.log("[Maintenance] Skipping fetchProjectVersions", projectId);
        return [];
    }
    const { data, error } = await supabase
        .from('project_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

    if (error) {
        console.error("Error fetching project versions:", error);
        throw error;
    }
    return data as ProjectVersion[];
};

export const createProjectVersion = async (projectId: string, design: any, commitMessage?: string) => {
    if (MAINTENANCE_MODE) {
        console.log("[Maintenance] Skipping createProjectVersion", projectId);
        return {
            id: 'maintenance-version',
            project_id: projectId,
            version_number: 999,
            created_at: new Date().toISOString(),
            design,
            commit_message: commitMessage
        } as ProjectVersion;
    }
    // 1. Get current latest version number
    const { data: latestVersion, error: fetchError } = await supabase
        .from('project_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (fetchError) throw fetchError;

    const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

    // 2. Insert new version
    const { data, error } = await supabase
        .from('project_versions')
        .insert([
            {
                project_id: projectId,
                version_number: nextVersionNumber,
                design: design, // design JSON
                commit_message: commitMessage || `Version ${nextVersionNumber}`
            }
        ])
        .select()
        .single();

    if (error) {
        console.error("Error creating project version:", error);
        throw error;
    }
    return data as ProjectVersion;
};
