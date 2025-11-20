import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { Shield, Check, X, Loader2 } from 'lucide-react';

interface Member {
  id: string;
  email: string;
  full_name?: string;
  avatar?: string;
  role?: string;
}

interface TeamPermissionsProps {
  teamId: string;
  members: Member[];
}

interface Permission {
  key: string;
  label: string;
  description: string;
  category: string;
}

const PERMISSIONS: Permission[] = [
  {
    key: 'view_messages',
    label: 'View Messages',
    description: 'Can read team messages and conversations',
    category: 'Communication'
  },
  {
    key: 'send_messages',
    label: 'Send Messages',
    description: 'Can send messages in team chat',
    category: 'Communication'
  },
  {
    key: 'schedule_meetings',
    label: 'Schedule Meetings',
    description: 'Can create and schedule team meetings',
    category: 'Meetings'
  },
  {
    key: 'manage_members',
    label: 'Manage Members',
    description: 'Can invite and remove team members',
    category: 'Administration'
  },
  {
    key: 'edit_permissions',
    label: 'Edit Permissions',
    description: 'Can modify permissions for other members',
    category: 'Administration'
  },
  {
    key: 'documents',
    label: 'Manage Documents',
    description: 'Can upload and manage team documents',
    category: 'Content'
  },
  {
    key: 'reports',
    label: 'View Reports',
    description: 'Can access and view team reports',
    category: 'Analytics'
  },
  {
    key: 'socials',
    label: 'Manage Socials',
    description: 'Can manage social media integrations',
    category: 'Integrations'
  },
  {
    key: 'webs',
    label: 'Manage Websites',
    description: 'Can manage connected websites',
    category: 'Integrations'
  }
];

const TeamPermissions: React.FC<TeamPermissionsProps> = ({ teamId, members }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const [permissionsMap, setPermissionsMap] = useState<Record<string, any>>({});
  const [permLoadingMap, setPermLoadingMap] = useState<Record<string, boolean>>({});
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, [teamId]);

  const loadPermissions = async () => {
    setPermissionsLoading(true);
    try {
      const { data: permsData, error } = await supabase
        .from('team_permissions')
        .select('user_id, permissions')
        .eq('team_id', teamId);

      if (!error && permsData) {
        const map: Record<string, any> = {};
        permsData.forEach((p: any) => {
          map[p.user_id] = p.permissions || {};
        });
        setPermissionsMap(map);
      }
    } catch (e) {
      console.warn('Permissions load failed', e);
    } finally {
      setPermissionsLoading(false);
    }
  };

  const togglePermission = async (memberId: string, permissionKey: string) => {
    const current = permissionsMap[memberId] || {};
    const next = { ...current, [permissionKey]: !current[permissionKey] };
    
    setPermissionsMap(prev => ({ ...prev, [memberId]: next }));
    setPermLoadingMap(prev => ({ ...prev, [memberId]: true }));

    try {
      // Update database
      const { error } = await supabase
        .from('team_permissions')
        .upsert({ 
          team_id: teamId, 
          user_id: memberId, 
          permissions: next 
        });

      if (error) throw error;

      // Sync with backend for additional processing
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      await fetch('/api/team/permissions-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ teamId, userId: memberId, permissions: next })
      });
    } catch (err) {
      console.error('Failed to update permission', err);
      // Revert on error
      setPermissionsMap(prev => ({ ...prev, [memberId]: current }));
    } finally {
      setPermLoadingMap(prev => ({ ...prev, [memberId]: false }));
    }
  };

  const getPermissionCount = (memberId: string) => {
    const perms = permissionsMap[memberId] || {};
    return Object.values(perms).filter(Boolean).length;
  };

  const groupedPermissions = PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            Team Permissions
          </h3>
        </div>
        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Control what each team member can access and modify
        </p>
      </div>

      <div className="grid gap-6">
        {members.map((member) => (
          <div key={member.id} className={`p-6 rounded-xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                  isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700'
                }`}>
                  {(member.full_name || member.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                    {member.full_name || member.email}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {member.email} • {getPermissionCount(member.id)} permissions granted
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                  isDark ? 'bg-slate-700 text-slate-200' : 'bg-gray-200 text-gray-700'
                }`}>
                  {member.role || 'Member'}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                <div key={category}>
                  <h4 className={`font-medium mb-4 text-sm uppercase tracking-wide ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    {category}
                  </h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {categoryPermissions.map((permission) => {
                      const hasPermission = permissionsMap[member.id]?.[permission.key];
                      const isLoading = permLoadingMap[member.id];
                      
                      return (
                        <label 
                          key={permission.key}
                          className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                            hasPermission
                              ? isDark 
                                ? 'border-green-500/50 bg-green-500/10' 
                                : 'border-green-500 bg-green-50'
                              : isDark
                                ? 'border-slate-700 hover:border-slate-600'
                                : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                checked={!!hasPermission}
                                onChange={() => togglePermission(member.id, permission.key)}
                                disabled={isLoading}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                hasPermission
                                  ? 'bg-green-500 border-green-500'
                                  : isDark
                                    ? 'border-slate-600 bg-slate-700'
                                    : 'border-gray-300 bg-white'
                              }`}>
                                {hasPermission && <Check className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium ${
                                isDark ? 'text-slate-100' : 'text-gray-900'
                              }`}>
                                {permission.label}
                              </div>
                              <div className={`text-xs mt-1 ${
                                isDark ? 'text-slate-400' : 'text-gray-500'
                              }`}>
                                {permission.description}
                              </div>
                            </div>
                          </div>
                          {isLoading && (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamPermissions;