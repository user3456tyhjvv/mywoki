import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import TeamChat from '../../TeamChat';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigation } from '../../../contexts/NavigationContext';
import { supabase } from '../../../lib/supabase';
import { fetchTeamMembers, inviteTeamMember, removeTeamMember, fetchTeamById, createTeam } from '../../../services/teamService';
import { MeetingIcon, UserIcon, SettingsIcon, Chaticon, UsersIcon } from '../../Icons';
import TeamPermissions from './TeamPermissions';
import MeetingScheduler from './MeetingScheduler';
import TeamSettingsModal from './TeamSettingsModal';
interface TeamProps {
  teamId?: string;
}

interface Member {
  id: string;
  email: string;
  full_name?: string;
  avatar?: string;
  role?: string;
}

interface TeamListItem {
  id: string;
  name: string;
}

const Team: React.FC<TeamProps> = ({ teamId }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const { user } = useAuth();
  const [allTeams, setAllTeams] = useState<TeamListItem[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const { setSelectedTeam, setActiveSection } = useNavigation();
  const [activeTab, setActiveTab] = useState<'members' | 'permissions' | 'chat' | 'meetings'>('members');

  useEffect(() => {
    if (!teamId) {
      const loadAllTeams = async () => {
        if (!user?.id) return;
        setLoadingTeams(true);
        try {
          const { data, error } = await supabase
            .from('team_members')
            .select('teams(id, name)')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error fetching teams:', error);
            return;
          }

          const teams = (data || []).map((item: any) => ({
            id: item.teams.id,
            name: item.teams.name,
          }));

          setAllTeams(teams);
        } catch (err) {
          console.error('Error loading teams:', err);
        } finally {
          setLoadingTeams(false);
        }
      };

      loadAllTeams();
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const t = await fetchTeamById(teamId);
        if (t?.name) setTeamName(t.name);
        const mems = await fetchTeamMembers(teamId);
        setMembers(mems || []);
      } catch (err) {
        console.error('Error loading team', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamId, user?.id]);

  const handleInvite = async () => {
    setInviteError(null);
    if (!inviteEmail || !inviteEmail.includes('@')) {
      setInviteError('Enter a valid email.');
      return;
    }

    try {
      setLoading(true);
      const res = await inviteTeamMember({ teamId, email: inviteEmail, inviterId: user?.id });
      if (res?.error) {
        setInviteError(res.error.message || 'Invite failed');
      } else {
        setInviteEmail('');
        const mems = await fetchTeamMembers(teamId);
        setMembers(mems || []);
      }
    } catch (err: any) {
      setInviteError(err?.message || 'Invite failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    await removeTeamMember(teamId, memberId);
    setMembers((m) => m.filter((x) => x.id !== memberId));
  };
// Add these states to the Team component
const [settingsModalOpen, setSettingsModalOpen] = useState(false);
const [currentTeam, setCurrentTeam] = useState<{ name: string; description?: string; avatarUrl?: string }>({
  name: teamName,
  description: '',
  avatarUrl: undefined
});

// Add this function to handle team updates
const handleTeamUpdate = (updates: { name?: string; description?: string; avatarUrl?: string }) => {
  if (updates.name) {
    setTeamName(updates.name);
    setCurrentTeam(prev => ({ ...prev, name: updates.name! }));
  }
  if (updates.description !== undefined) {
    setCurrentTeam(prev => ({ ...prev, description: updates.description }));
  }
  if (updates.avatarUrl !== undefined) {
    setCurrentTeam(prev => ({ ...prev, avatarUrl: updates.avatarUrl }));
  }
};

const handleTeamDelete = (deletedTeamId: string) => {
  if (deletedTeamId === teamId) {
    setSelectedTeam(undefined);
    setActiveSection('team');
  }
};
  const handleCreateTeam = async () => {
    setCreateError(null);
    if (!newTeamName || newTeamName.trim().length === 0) {
      setCreateError('Enter a team name');
      return;
    }
    if (!user?.id) {
      setCreateError('You must be signed in to create a team');
      return;
    }

    try {
      setCreatingTeam(true);
      const res = await createTeam(newTeamName.trim(), user.id);
      if (res?.team?.id) {
        const { data, error } = await supabase
          .from('team_members')
          .select('teams(id, name)')
          .eq('user_id', user.id);

        if (!error) {
          const teams = (data || []).map((item: any) => ({ id: item.teams.id, name: item.teams.name }));
          setAllTeams(teams);
        }

        setSelectedTeam(res.team.id);
        setActiveSection('team');
      } else {
        setCreateError('Could not create team');
      }
    } catch (err: any) {
      console.error('create team error', err);
      setCreateError(err?.message || 'Create failed');
    } finally {
      setCreatingTeam(false);
      setNewTeamName('');
    }
  };

  return (
    <div className={`rounded-lg p-6 ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-slate-200'}`}>
      {!teamId ? (
        <div>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Your Teams</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Create a new team</label>
            <div className="flex gap-3">
              <input
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                onClick={handleCreateTeam} 
                disabled={creatingTeam} 
                className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {creatingTeam ? 'Creating...' : 'Create Team'}
              </button>
            </div>
            {createError && <div className="text-sm text-red-500 mt-2">{createError}</div>}
          </div>
          
          {loadingTeams ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : allTeams.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {allTeams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    setSelectedTeam(team.id);
                    setActiveSection('team');
                  }}
                  className={`text-left p-6 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    isDark
                      ? 'border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                      isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {team.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{team.name}</h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Click to view details</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 rounded-xl border-2 border-dashed ${isDark ? 'border-slate-700 text-slate-400' : 'border-gray-300 text-gray-500'}`}>
              <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No teams found</p>
              <p className="text-sm mt-2">Create your first team to get started!</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className={`text-3xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{teamName || 'Team'}</h1>
                <p className={`text-lg ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Manage your team members and settings</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
  onClick={() => setSettingsModalOpen(true)}
  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
    isDark 
      ? 'border-slate-700 text-slate-200 hover:bg-slate-800' 
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`}
>
  Team Settings
</button>

              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-700/40">
              <nav className="flex gap-8">
                <button 
                  onClick={() => setActiveTab('members')} 
                  className={`pb-4 flex items-center gap-3 font-medium transition-colors ${
                    activeTab === 'members' 
                      ? 'text-blue-500 border-b-2 border-blue-500' 
                      : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')
                  }`}
                >
                  <UsersIcon className="w-5 h-5" />
                  Members
                </button>
                <button 
                  onClick={() => setActiveTab('permissions')} 
                  className={`pb-4 flex items-center gap-3 font-medium transition-colors ${
                    activeTab === 'permissions' 
                      ? 'text-blue-500 border-b-2 border-blue-500' 
                      : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')
                  }`}
                >
                  <SettingsIcon className="w-5 h-5" />
                  Permissions
                </button>
                <button 
                  onClick={() => setActiveTab('chat')} 
                  className={`pb-4 flex items-center gap-3 font-medium transition-colors ${
                    activeTab === 'chat' 
                      ? 'text-blue-500 border-b-2 border-blue-500' 
                      : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')
                  }`}
                >
                  <Chaticon className="w-5 h-5" />
                  Team Chat
                </button>
                <button 
                  onClick={() => setActiveTab('meetings')} 
                  className={`pb-4 flex items-center gap-3 font-medium transition-colors ${
                    activeTab === 'meetings' 
                      ? 'text-blue-500 border-b-2 border-blue-500' 
                      : (isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700')
                  }`}
                >
                  <MeetingIcon className="w-5 h-5" />
                  Meetings
                </button>
              </nav>
            </div>
          </div>

          <div className="mt-6">
            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <h3 className={`font-semibold text-lg mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>Invite Team Members</h3>
                  <div className="flex gap-3 items-center">
                    <input 
                      value={inviteEmail} 
                      onChange={(e) => setInviteEmail(e.target.value)} 
                      placeholder="Enter email address..." 
                      className={`flex-1 px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        isDark 
                          ? 'bg-slate-900 border-slate-700 text-slate-200' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`} 
                    />
                    <button 
                      onClick={handleInvite} 
                      className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                    >
                      Send Invite
                    </button>
                  </div>
                  {inviteError && <div className="text-red-500 text-sm mt-2">{inviteError}</div>}
                </div>

                <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                      Team Members ({members.length})
                    </h3>
                    <button 
                      onClick={() => { setSelectedTeam(undefined); setActiveSection('team'); }} 
                      className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      Back to Teams
                    </button>
                  </div>

                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {members.map((m) => (
                        <div key={m.id} className={`flex items-center justify-between p-4 rounded-lg ${
                          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-gray-50 border border-gray-100'
                        }`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                              isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {(m.full_name || m.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                                {m.full_name || m.email}
                              </div>
                              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                                {m.email}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                              isDark ? 'bg-slate-700 text-slate-200' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {m.role || 'Member'}
                            </span>
                            <button 
                              onClick={() => handleRemove(m.id)} 
                              className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors" 
                              title="Remove member"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                      {members.length === 0 && (
                        <div className={`text-center py-8 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                          No team members yet. Invite someone to get started!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'permissions' && (
              <TeamPermissions teamId={teamId} members={members} />
            )}

            {activeTab === 'chat' && (
              <TeamChat teamId={teamId} />
            )}

            {activeTab === 'meetings' && (
              <MeetingScheduler teamId={teamId} />
            )}
          </div>
        </>
      )}
      <TeamSettingsModal
  teamId={teamId}
  teamName={currentTeam.name}
  teamDescription={currentTeam.description}
  avatarUrl={currentTeam.avatarUrl}
  isOpen={settingsModalOpen}
  onClose={() => setSettingsModalOpen(false)}
  onTeamUpdate={handleTeamUpdate}
  onTeamDelete={handleTeamDelete}
  userRole="admin" // You'll need to get this from your team members data
/>
    </div>
    
  );
};

export default Team;