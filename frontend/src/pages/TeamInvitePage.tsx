import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';

const TeamInvitePage: React.FC = () => {
  const navigate = useNavigate();
  const { teamId } = useParams<{ teamId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      if (!teamId) {
        setError('Invalid invite link');
        setLoading(false);
        return;
      }
      try {
        // Ensure the team exists first (for a better error message), then join directly (idempotent)
        await apiService.getTeamById(teamId);
        await apiService.joinTeamDirect(teamId);
        if (!isMounted) return;
        navigate(`/chat/t/${encodeURIComponent(teamId)}`, { replace: true });
      } catch (e: any) {
        setError(e?.message || 'Failed to open invite');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [teamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white border rounded-xl p-6 text-center">
        <h1 className="text-lg font-semibold mb-2">Team Invite</h1>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <p className="text-sm text-gray-600">Redirecting…</p>
        )}
      </div>
    </div>
  );
};

export default TeamInvitePage;


