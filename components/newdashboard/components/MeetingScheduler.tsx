import React, { useEffect, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import { 
  Calendar, 
  Video, 
  Plus, 
  Clock, 
  Users, 
  Lock, 
  Copy, 
  Trash2,
  Edit3,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  room_name: string;
  start_at: string | null;
  passcode?: string | null;
  created_at: string;
}

interface MeetingSchedulerProps {
  teamId: string;
}

const generateRoomName = (teamId: string) => {
  const hash = Math.random().toString(36).slice(2, 9);
  return `team-${teamId}-${hash}`;
};

const MeetingScheduler: React.FC<MeetingSchedulerProps> = ({ teamId }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [title, setTitle] = useState('Team Meeting');
  const [time, setTime] = useState('');
  const [passcode, setPasscode] = useState('');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);
  const [activeMeeting, setActiveMeeting] = useState<string | null>(null);

  useEffect(() => {
    loadMeetings();
  }, [teamId]);

  const loadMeetings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('team_meetings')
        .select('*')
        .eq('team_id', teamId)
        .order('start_at', { ascending: true });
      
      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async () => {
    if (!title.trim()) return;

    setCreating(true);
    try {
      const room = generateRoomName(teamId);
      const payload = {
        team_id: teamId,
        title: title.trim(),
        room_name: room,
        start_at: time || null,
        passcode: passcode.trim() || null,
      };

      const { data, error } = await supabase
        .from('team_meetings')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      setMeetings(prev => [data, ...prev]);
      setTitle('Team Meeting');
      setTime('');
      setPasscode('');
    } catch (error) {
      console.error('Error creating meeting:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('Are you sure you want to delete this meeting?')) return;

    try {
      const { error } = await supabase
        .from('team_meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;

      setMeetings(prev => prev.filter(meeting => meeting.id !== meetingId));
    } catch (error) {
      console.error('Error deleting meeting:', error);
    }
  };

  const joinMeeting = (room: string, passcode?: string | null) => {
    let url = `https://meet.jit.si/${encodeURIComponent(room)}`;
    if (passcode) {
      url += `#config.prejoinPageEnabled=false&config.requireDisplayName=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&appData.token=${passcode}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer,width=1200,height=800');
  };

  const copyMeetingLink = async (room: string, passcode?: string | null) => {
    let url = `https://meet.jit.si/${encodeURIComponent(room)}`;
    if (passcode) {
      url += `?code=${passcode}`;
    }
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedMeetingId(room);
      setTimeout(() => setCopiedMeetingId(null), 2000);
    } catch (err) {
      console.error('Failed to copy meeting link:', err);
    }
  };

  const formatMeetingTime = (startAt: string | null) => {
    if (!startAt) return 'Instant Meeting';
    
    const now = new Date();
    const meetingTime = new Date(startAt);
    const diffMs = meetingTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      return `Started ${Math.abs(Math.floor(diffHours))}h ago`;
    } else if (diffHours < 24) {
      return `Today at ${meetingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffHours < 48) {
      return `Tomorrow at ${meetingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return meetingTime.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
  };

  const isMeetingUpcoming = (startAt: string | null) => {
    if (!startAt) return true;
    return new Date(startAt) > new Date();
  };

  const upcomingMeetings = meetings.filter(meeting => isMeetingUpcoming(meeting.start_at));
  const pastMeetings = meetings.filter(meeting => !isMeetingUpcoming(meeting.start_at));

  return (
    <div className="space-y-6">
      {/* Schedule New Meeting Card */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-900/50' : 'bg-blue-100'}`}>
            <Calendar className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
              Schedule New Meeting
            </h3>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
              Create a new meeting for your team
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
              Meeting Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter meeting title..."
              className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDark 
                  ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                <Clock className="w-4 h-4 inline mr-2" />
                Schedule Time
              </label>
              <input
                type="datetime-local"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-100' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                <Lock className="w-4 h-4 inline mr-2" />
                Passcode (Optional)
              </label>
              <input
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode..."
                className={`w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCreateMeeting}
              disabled={!title.trim() || creating}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
            
            <button
              onClick={() => joinMeeting(generateRoomName(teamId))}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Video className="w-4 h-4" />
              Start Instant Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Meetings */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-green-900/50' : 'bg-green-100'}`}>
              <Clock className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                Upcoming Meetings
              </h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {upcomingMeetings.length} scheduled
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : upcomingMeetings.length > 0 ? (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className={`p-4 rounded-lg border transition-all ${
                  isDark 
                    ? 'bg-slate-900 border-slate-700 hover:border-slate-600' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      isDark ? 'bg-blue-900/50' : 'bg-blue-100'
                    }`}>
                      <Video className="w-5 h-5 text-blue-500" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold truncate ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                        {meeting.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <span className={`flex items-center gap-1 text-sm ${
                          isDark ? 'text-slate-400' : 'text-gray-500'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {formatMeetingTime(meeting.start_at)}
                        </span>
                        {meeting.passcode && (
                          <span className={`flex items-center gap-1 text-sm ${
                            isDark ? 'text-slate-400' : 'text-gray-500'
                          }`}>
                            <Lock className="w-3 h-3" />
                            Passcode protected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyMeetingLink(meeting.room_name, meeting.passcode)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark 
                          ? 'hover:bg-slate-700 text-slate-400' 
                          : 'hover:bg-gray-200 text-gray-500'
                      }`}
                      title="Copy meeting link"
                    >
                      {copiedMeetingId === meeting.room_name ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => joinMeeting(meeting.room_name, meeting.passcode)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      Join
                    </button>

                    <button
                      onClick={() => handleDeleteMeeting(meeting.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isDark 
                          ? 'hover:bg-red-500/10 text-red-400' 
                          : 'hover:bg-red-50 text-red-500'
                      }`}
                      title="Delete meeting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 rounded-lg border-2 border-dashed ${
            isDark ? 'border-slate-700 text-slate-400' : 'border-gray-300 text-gray-500'
          }`}>
            <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No upcoming meetings</p>
            <p className="text-sm mt-1">Schedule a meeting to get started</p>
          </div>
        )}
      </div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div className={`p-6 rounded-xl ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Clock className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                Past Meetings
              </h3>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                {pastMeetings.length} completed
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pastMeetings.slice(0, 5).map((meeting) => (
              <div
                key={meeting.id}
                className={`p-4 rounded-lg border ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      isDark ? 'bg-slate-700' : 'bg-gray-200'
                    }`}>
                      <Video className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h4 className={`font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                        {meeting.title}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                        {formatMeetingTime(meeting.start_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark 
                        ? 'hover:bg-red-500/10 text-red-400' 
                        : 'hover:bg-red-50 text-red-500'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;