import { supabase } from '../lib/supabase';

export const fetchTeamById = async (teamId: string) => {
  const { data, error } = await supabase.from('teams').select('*').eq('id', teamId).single();
  if (error) throw error;
  return data;
};

export const fetchTeamMembers = async (teamId: string) => {
  const { data, error } = await supabase.from('team_members').select('user_id:users(id, full_name, email, avatar), role').eq('team_id', teamId);
  if (error) {
    console.error('fetchTeamMembers error', error);
    return [];
  }
  // normalize
  const members = (data || []).map((r: any) => ({ id: r.user_id.id, email: r.user_id.email, full_name: r.user_id.full_name, avatar: r.user_id.avatar, role: r.role }));
  return members;
};

export const inviteTeamMember = async ({ teamId, email, inviterId, permissions }: { teamId: string; email: string; inviterId?: string; permissions?: any }) => {
  try {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // Try to attach bearer token from Supabase client session for secure server verification
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      // ignore
    }

    const res = await fetch(`${backendUrl}/api/team/invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ teamId, email, inviterId, permissions })
    });

    const json = await res.json();
    if (!res.ok) return { error: json || { message: 'Invite failed' } };
    return { data: json.invite };
  } catch (err: any) {
    console.error('inviteTeamMember network error', err);
    return { error: { message: err.message || 'Network error' } };
  }
};

export const removeTeamMember = async (teamId: string, userId: string) => {
  const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
  if (error) throw error;
  // create in-app notification for main user is required on server side; client can create a notification for the main user if needed
  return true;
};

export const createTeam = async (name: string, ownerUserId?: string) => {
  if (!name || name.trim().length === 0) {
    throw new Error('Team name is required');
  }

  // Insert team
  const { data: teamData, error: teamError } = await supabase.from('teams').insert({ name }).select().single();
  if (teamError) {
    console.error('createTeam error', teamError);
    throw teamError;
  }

  const teamId = teamData?.id;

  // Add owner to team_members if ownerUserId provided
  if (ownerUserId && teamId) {
    const { error: memberError } = await supabase.from('team_members').insert({ team_id: teamId, user_id: ownerUserId, role: 'owner' });
    if (memberError) {
      console.error('createTeam - add owner error', memberError);
      // not throwing to allow the created team to exist; return team data and member error
      return { team: teamData, memberError };
    }
  }

  return { team: teamData };
};
