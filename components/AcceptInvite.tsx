import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const AcceptInvite: React.FC = () => {
  const query = useQuery();
  const inviteId = query.get('invite');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [inviteInfo, setInviteInfo] = useState<any | null>(null);

  const handleAccept = async () => {
    if (!inviteId || !user) return;
    setStatus('loading');
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (token) headers['Authorization'] = `Bearer ${token}`;
        else headers['x-user-id'] = user.id;
      } catch (e) {
        headers['x-user-id'] = user.id;
      }

      const res = await fetch(`${backendUrl}/api/team/accept`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ inviteId })
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(json?.error || 'Failed to accept invite');
        return;
      }
      setStatus('success');
      setMessage('Invite accepted — you were added to the team');
      setTimeout(() => navigate('/new-dashboard'), 1200);
    } catch (err: any) {
      setStatus('error');
      setMessage(err?.message || 'Network error');
    }
  };

  useEffect(() => {
    const loadAndMaybeAccept = async () => {
      if (!inviteId) {
        setStatus('error');
        setMessage('No invite id provided');
        return;
      }

      // Load invite details for preview
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
        const infoRes = await fetch(`${backendUrl}/api/team/invite/${inviteId}`);
        if (infoRes.ok) {
          const infoJson = await infoRes.json();
          setInviteInfo(infoJson);
        }
      } catch (e) {
        // ignore preview failure
      }

      if (!user) {
        // If user not signed in, redirect to sign-in page preserving invite
        navigate(`/getting-started?redirect=/team/invite/accept?invite=${inviteId}`);
        return;
      }

      // Do not auto-accept; show UI to accept
    };

    loadAndMaybeAccept();
  }, [inviteId, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full p-6 rounded shadow">
        {status === 'loading' && <div>Accepting invite…</div>}
        {status === 'success' && <div className="text-green-600">{message}</div>}
        {status === 'error' && <div className="text-red-600">{message}</div>}
        {inviteInfo ? (
          <div>
            <h3 className="text-xl font-semibold mb-2">Invite to join {inviteInfo.team?.name || 'team'}</h3>
            <p className="mb-2">Invited by: {inviteInfo.inviter?.full_name || inviteInfo.inviter?.email || 'Unknown'}</p>
            <div className="flex gap-2">
              <button onClick={handleAccept} className="px-4 py-2 rounded bg-blue-600 text-white">Accept Invite</button>
              <button onClick={() => navigate('/new-dashboard')} className="px-4 py-2 rounded border">Cancel</button>
            </div>
          </div>
        ) : (
          <div>Preparing to accept invite…</div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
