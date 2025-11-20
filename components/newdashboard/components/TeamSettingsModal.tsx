import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { 
  X, 
  Settings, 
  Edit3, 
  Trash2, 
  Upload, 
  Users, 
  Shield, 
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  CheckCircle2,
  Image,
  Loader2
} from 'lucide-react';

interface TeamSettingsModalProps {
  teamId: string;
  teamName: string;
  teamDescription?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onTeamUpdate: (updates: { name?: string; description?: string; avatarUrl?: string }) => void;
  onTeamDelete: (teamId: string) => void;
  userRole: 'owner' | 'admin' | 'member';
}

const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({
  teamId,
  teamName,
  teamDescription = '',
  avatarUrl,
  bannerUrl,
  isOpen,
  onClose,
  onTeamUpdate,
  onTeamDelete,
  userRole
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'danger'>('general');
  const [name, setName] = useState(teamName);
  const [description, setDescription] = useState(teamDescription);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [bucketInitialized, setBucketInitialized] = useState(false);
  const [initializingBucket, setInitializingBucket] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize the storage bucket when modal opens
  useEffect(() => {
    if (isOpen && isAdmin) {
      initializeBucket();
    }
  }, [isOpen]);

  const isAdmin = userRole === 'owner' || userRole === 'admin';

  const initializeBucket = async () => {
    if (bucketInitialized) return;

    setInitializingBucket(true);
    try {
      // Check if bucket exists
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;

      const teamAssetsBucket = buckets.find(bucket => bucket.name === 'team-assets');
      
      if (!teamAssetsBucket) {
        // Create the bucket if it doesn't exist
        const { error: createError } = await supabase.storage.createBucket('team-assets', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880, // 5MB
        });

        if (createError) {
          // If bucket creation fails, it might already exist or we don't have permissions
          console.warn('Bucket might already exist or no permissions:', createError);
        }
      }

      setBucketInitialized(true);
    } catch (error) {
      console.error('Error initializing bucket:', error);
    } finally {
      setInitializingBucket(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const updates: any = {};
      if (name !== teamName) updates.name = name;
      if (description !== teamDescription) updates.description = description;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('teams')
          .update(updates)
          .eq('id', teamId);

        if (error) throw error;

        // Log the change
        await supabase.from('team_audit_log').insert({
          team_id: teamId,
          user_id: user?.id,
          action: 'update',
          resource_type: 'team',
          resource_id: teamId,
          old_values: { name: teamName, description: teamDescription },
          new_values: updates
        });

        onTeamUpdate(updates);
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Error updating team settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !isAdmin) return;

    const file = event.target.files[0];
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Ensure bucket is initialized
      if (!bucketInitialized) {
        await initializeBucket();
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${teamId}/avatar-${Date.now()}.${fileExt}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('team-assets')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found')) {
          // Retry after ensuring bucket exists
          await initializeBucket();
          const { error: retryError } = await supabase.storage
            .from('team-assets')
            .upload(fileName, file, { upsert: true });
          if (retryError) throw retryError;
        } else {
          throw uploadError;
        }
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('team-assets')
        .getPublicUrl(fileName);

      // Update the team record with the new avatar URL
      const { error: updateError } = await supabase
        .from('teams')
        .update({ avatar_url: publicUrl })
        .eq('id', teamId);

      if (updateError) throw updateError;

      // Log the change
      await supabase.from('team_audit_log').insert({
        team_id: teamId,
        user_id: user?.id,
        action: 'update',
        resource_type: 'team',
        resource_id: teamId,
        old_values: { avatar_url: avatarUrl },
        new_values: { avatar_url: publicUrl }
      });

      onTeamUpdate({ avatarUrl: publicUrl });
      
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      alert(error.message || 'Error uploading image. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!isAdmin || !avatarUrl) return;

    setUploading(true);
    try {
      // Extract the file path from the URL to delete from storage
      const urlParts = avatarUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${teamId}/${fileName}`;

      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from('team-assets')
        .remove([filePath]);

      if (deleteError) {
        console.warn('Could not delete file from storage:', deleteError);
        // Continue with database update even if storage delete fails
      }

      // Update the team record to remove avatar URL
      const { error: updateError } = await supabase
        .from('teams')
        .update({ avatar_url: null })
        .eq('id', teamId);

      if (updateError) throw updateError;

      // Log the change
      await supabase.from('team_audit_log').insert({
        team_id: teamId,
        user_id: user?.id,
        action: 'update',
        resource_type: 'team',
        resource_id: teamId,
        old_values: { avatar_url: avatarUrl },
        new_values: { avatar_url: null }
      });

      onTeamUpdate({ avatarUrl: undefined });
      
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Error removing team avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!isAdmin || deleteConfirmText !== teamName) return;

    setLoading(true);
    try {
      // First, delete any team assets from storage
      if (avatarUrl) {
        try {
          const urlParts = avatarUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${teamId}/${fileName}`;
          
          await supabase.storage
            .from('team-assets')
            .remove([filePath]);
        } catch (storageError) {
          console.warn('Could not delete team assets from storage:', storageError);
        }
      }

      // Soft delete - set deleted_at timestamp
      const { error } = await supabase
        .from('teams')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', teamId);

      if (error) throw error;

      // Log the deletion
      await supabase.from('team_audit_log').insert({
        team_id: teamId,
        user_id: user?.id,
        action: 'delete',
        resource_type: 'team',
        resource_id: teamId,
        old_values: { name: teamName, description, avatar_url: avatarUrl },
        new_values: { deleted_at: new Date().toISOString() }
      });

      onTeamDelete(teamId);
      onClose();
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Error deleting team');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  };

  const resetForm = () => {
    setName(teamName);
    setDescription(teamDescription);
    setIsEditing(false);
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Get optimized avatar URL with transformations
  const getOptimizedAvatarUrl = (url: string) => {
    if (!url) return url;
    
    // Supabase Storage supports image transformations via URL parameters
    // This creates a 150x150 cropped version for better performance
    return `${url}?width=150&height=150&quality=80&fit=crop`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl ${
          isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-blue-500" />
            <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              Team Settings
            </h2>
          </div>
          <button
            onClick={handleClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`border-b ${
          isDark ? 'border-slate-700' : 'border-gray-200'
        }`}>
          <nav className="flex px-6 -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-500 text-blue-500'
                  : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-200'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'appearance'
                  ? 'border-blue-500 text-blue-500'
                  : isDark
                    ? 'border-transparent text-slate-400 hover:text-slate-200'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Appearance
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('danger')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'danger'
                    ? 'border-red-500 text-red-500'
                    : isDark
                      ? 'border-transparent text-slate-400 hover:text-slate-200'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Danger Zone
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                    Team Information
                  </h3>
                  {isAdmin && !isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Team Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-slate-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Enter team name..."
                      />
                    ) : (
                      <div className={`px-4 py-3 rounded-lg ${
                        isDark ? 'bg-slate-800 text-slate-100' : 'bg-gray-50 text-gray-900'
                      }`}>
                        {teamName}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Description
                    </label>
                    {isEditing ? (
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-slate-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Describe your team's purpose..."
                      />
                    ) : (
                      <div className={`px-4 py-3 rounded-lg ${
                        isDark ? 'bg-slate-800 text-slate-100' : 'bg-gray-50 text-gray-900'
                      }`}>
                        {description || 'No description provided'}
                      </div>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={handleSaveChanges}
                        disabled={loading || !name.trim()}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          'Save Changes'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setName(teamName);
                          setDescription(teamDescription);
                          setIsEditing(false);
                        }}
                        className="px-6 py-3 rounded-lg border font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                isDark ? 'bg-slate-800 border border-slate-700' : 'bg-blue-50 border border-blue-200'
              }`}>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className={`font-medium ${isDark ? 'text-slate-100' : 'text-blue-900'}`}>
                      Team Permissions
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-blue-700'}`}>
                      Your role: <span className="font-medium capitalize">{userRole}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                  Team Avatar
                </h3>
                
                <div className="flex items-center gap-6">
                  <div className="relative">
                    {avatarUrl ? (
                      <div className="relative">
                        <img
                          src={getOptimizedAvatarUrl(avatarUrl)}
                          alt={`${teamName} avatar`}
                          className="w-20 h-20 rounded-xl object-cover border-2 border-slate-700"
                        />
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-bold border-2 ${
                        isDark ? 'bg-blue-900 text-blue-100 border-slate-700' : 'bg-blue-100 text-blue-700 border-gray-300'
                      }`}>
                        {uploading ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                          teamName.charAt(0).toUpperCase()
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Upload a team avatar image. Recommended: 256x256 pixels. Max size: 5MB. Supported formats: JPG, PNG, WebP, GIF.
                    </p>
                    
                    {initializingBucket ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Initializing storage...
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp,.gif"
                          onChange={handleAvatarUpload}
                          className="hidden"
                          disabled={!isAdmin || uploading}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!isAdmin || uploading}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {uploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {uploading ? 'Uploading...' : 'Upload Avatar'}
                        </button>
                        
                        {avatarUrl && isAdmin && (
                          <button
                            onClick={handleRemoveAvatar}
                            disabled={uploading}
                            className="px-4 py-2 rounded-lg border font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {!isAdmin && (
                <div className={`p-4 rounded-lg border ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-500" />
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      Only team administrators can modify team appearance settings.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'danger' && isAdmin && (
            <div className="space-y-6">
              {!showDeleteConfirm ? (
                <>
                  <div className={`p-6 rounded-lg border ${
                    isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                      <h3 className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                        Delete Team
                      </h3>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                      Once you delete a team, there is no going back. All team data, including members, 
                      meetings, and chat history will be permanently removed. This action cannot be undone.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Team
                  </button>
                </>
              ) : (
                <div className={`p-6 rounded-lg border ${
                  isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h3 className={`font-semibold ${isDark ? 'text-red-400' : 'text-red-800'}`}>
                      Confirm Team Deletion
                    </h3>
                  </div>
                  
                  <p className={`text-sm mb-4 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    To confirm deletion, please type the team name <strong>"{teamName}"</strong> below:
                  </p>

                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={`Type "${teamName}" to confirm`}
                    className={`w-full px-4 py-3 rounded-lg border mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-100' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteTeam}
                      disabled={loading || deleteConfirmText !== teamName}
                      className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </span>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Yes, Delete Team
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-6 py-3 rounded-lg border font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamSettingsModal;