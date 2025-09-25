import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

type SearchResult = {
  id: string;
  label: string;
  subLabel?: string;
  kind: 'user' | 'team' | 'tournament' | 'game';
  navigateTo: string;
};

const DEBOUNCE_MS = 250;

export const GlobalSearch: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<{ users?: any[]; teams?: any[]; tournaments?: any[]; games?: any[] }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const currentUserId = apiService.getUserIdFromToken();
  const [friendIds, setFriendIds] = useState<Set<string>>(new Set());

  // Close on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Load friends once to know which users are already friends
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const friends = await apiService.listFriends();
        if (!mounted) return;
        const ids = new Set<string>((friends || []).map((f: any) => f.user_id));
        setFriendIds(ids);
      } catch {
        // ignore if unauthenticated
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as SearchResult[];
    const users = (cacheRef.current.users || [])
      .filter((u: any) => u.user_id !== currentUserId)
      .filter((u: any) =>
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.location || '').toLowerCase().includes(q) ||
        (u.user_id || '').toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((u: any) => ({
        id: u.user_id,
        label: u.displayName || u.user_id,
        subLabel: u.location ? `${u.location} • ${u.user_id}` : u.user_id,
        kind: 'user' as const,
        navigateTo: `/users/${u.user_id}`,
      }));

    const teams = (cacheRef.current.teams || [])
      .filter((t: any) =>
        (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.gameName || t.game?.name || '').toLowerCase().includes(q) ||
        (t.id || '').toLowerCase().includes(q)
      )
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        label: t.title,
        subLabel: (t.gameName || t.game?.name) ? `${t.gameName || t.game?.name} • ${t.id}` : t.id,
        kind: 'team' as const,
        navigateTo: `/chat?teamId=${encodeURIComponent(t.id)}`,
      }));

    const tournaments = (cacheRef.current.tournaments || [])
      .filter((t: any) => (t.title || '').toLowerCase().includes(q) || (t.location || '').toLowerCase().includes(q) || (t.game?.name || t.gameId || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        label: t.title,
        subLabel: t.game?.name || t.location,
        kind: 'tournament' as const,
        navigateTo: `/tournaments/${t.id}`,
      }));

    const games = (cacheRef.current.games || [])
      .filter((g: any) => (g.name || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((g: any) => ({
        id: g.name,
        label: g.name,
        subLabel: 'Game',
        kind: 'game' as const,
        navigateTo: `/games/${encodeURIComponent(g.name)}`,
      }));

    return [...users, ...teams, ...tournaments, ...games].slice(0, 12);
  }, [query]);

  // Debounced loader: fetch search results using backend filtering for users and public teams
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setIsLoading(false);
      return;
    }

    let active = true;
    const handle = setTimeout(async () => {
      try {
        setIsLoading(true);
        const q = query.trim();
        // Always fetch fresh filtered users and public teams for the current query
        const [usersRes, teamsRes, tournamentsRes, gamesRes] = await Promise.allSettled([
          apiService.listUsers({ page: 1, limit: 50, search: q }),
          // Prefer server-side search for teams if available
          apiService.getAllTeams({ page: 1, limit: 50, search: q, isPublic: true }),
          cacheRef.current.tournaments ? Promise.resolve({ data: cacheRef.current.tournaments } as any) : apiService.getTournaments(),
          cacheRef.current.games ? Promise.resolve({ data: cacheRef.current.games } as any) : apiService.getGames(),
        ]);

        // Normalize and cache datasets
        if (usersRes.status === 'fulfilled') {
          const val: any = usersRes.value;
          // listUsers can return array or { users }
          const list = Array.isArray(val) ? val : (val?.users || val?.data || val?.data?.users || []);
          cacheRef.current.users = Array.isArray(list) ? list : [];
        }
        if (teamsRes.status === 'fulfilled') {
          const val: any = teamsRes.value;
          const list = (val?.data?.data) || (val?.data?.teams) || val?.teams || val?.data || [];
          cacheRef.current.teams = Array.isArray(list) ? list : [];
        }
        if (tournamentsRes.status === 'fulfilled' && !cacheRef.current.tournaments) {
          const val: any = tournamentsRes.value;
          const list = val?.data || val?.tournaments || [];
          cacheRef.current.tournaments = Array.isArray(list) ? list : [];
        }
        if (gamesRes.status === 'fulfilled' && !cacheRef.current.games) {
          const val: any = gamesRes.value;
          cacheRef.current.games = Array.isArray(val) ? val : (val?.data || []);
        }

        if (!active) return;
        setResults(filtered);
        setOpen(true);
        setHighlightIdx(0);
      } finally {
        if (active) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [query, filtered]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, (results.length || 1) - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[highlightIdx];
      if (item) {
        setOpen(false);
        navigate(item.navigateTo);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const iconFor = (kind: SearchResult['kind']) => {
    switch (kind) {
      case 'user':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        );
      case 'team':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        );
      case 'tournament':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        );
      case 'game':
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        );
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className || ''}`}>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </span>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { if (query.trim().length >= 2) setOpen(true); }}
          onKeyDown={onKeyDown}
          placeholder="Search players (name/id), public teams, tournaments, games..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {isLoading && (
          <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </span>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute mt-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl z-30 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No results</div>
          ) : (
            <ul className="max-h-80 overflow-auto divide-y divide-gray-100">
              {filtered.map((item, idx) => (
                <li
                  key={`${item.kind}-${item.id}`}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  onMouseDown={(e) => { e.preventDefault(); }}
                  onClick={() => { setOpen(false); navigate(item.navigateTo); }}
                  className={`px-4 py-3 cursor-pointer flex items-center gap-3 ${idx === highlightIdx ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex-shrink-0 text-gray-500">{iconFor(item.kind)}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{item.label}</div>
                    {item.subLabel && (
                      <div className="text-xs text-gray-500 truncate">{item.subLabel}</div>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    {item.kind === 'user' && item.id !== currentUserId && (
                      friendIds.has(item.id) ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpen(false); navigate(`/chat?friendId=${encodeURIComponent(item.id)}`); }}
                          className="text-[11px] px-2 py-1 rounded border border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                        >
                          Message
                        </button>
                      ) : (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            setActionLoading(`user:${item.id}`);
                            try {
                              await apiService.sendFriendRequest(item.id);
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          disabled={actionLoading === `user:${item.id}`}
                          className="text-[11px] px-2 py-1 rounded border border-blue-300 text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                        >
                          {actionLoading === `user:${item.id}` ? 'Sending…' : 'Send request'}
                        </button>
                      )
                    )}
                    {item.kind === 'team' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          setActionLoading(`team:${item.id}`);
                          try {
                            await apiService.requestToJoinTeam(item.id);
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                        disabled={actionLoading === `team:${item.id}`}
                        className="text-[11px] px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                      >
                        {actionLoading === `team:${item.id}` ? 'Requesting…' : 'Request to join'}
                      </button>
                    )}
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">{item.kind}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 bg-gray-50 text-[11px] text-gray-500 hidden md:block">Press Enter to open • ESC to close</div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;


