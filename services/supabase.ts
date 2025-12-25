import { createClient } from '@supabase/supabase-js';

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
    tags?: string[];
    design: {
        components: any[];
        connections: any[];
        code: string;
    };
}

export const saveProject = async (project: ProjectData) => {
    const { data, error } = await supabase
        .from('projects')
        .insert([
            {
                name: project.name,
                description: project.description,
                owner_id: project.owner_id,
                owner_name: project.owner_name,
                is_public: project.is_public || false,
                tags: project.tags || [],
                design: project.design
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
