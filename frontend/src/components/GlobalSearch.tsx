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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as SearchResult[];
    const users = (cacheRef.current.users || [])
      .filter((u: any) => (u.displayName || '').toLowerCase().includes(q) || (u.location || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((u: any) => ({
        id: u.user_id,
        label: u.displayName,
        subLabel: u.location,
        kind: 'user' as const,
        navigateTo: `/users/${u.user_id}`,
      }));

    const teams = (cacheRef.current.teams || [])
      .filter((t: any) => (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q) || (t.gameName || t.game?.name || '').toLowerCase().includes(q))
      .slice(0, 5)
      .map((t: any) => ({
        id: t.id,
        label: t.title,
        subLabel: t.gameName || t.game?.name,
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

  // Debounced loader: load datasets once per session (or on demand)
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
        // If not cached, fetch in parallel
        const promises: Array<Promise<any>> = [];
        if (!cacheRef.current.users) promises.push(apiService.listUsers({ page: 1, limit: 200 }));
        if (!cacheRef.current.teams) promises.push(apiService.getPublicTeams({ page: 1, limit: 200 }));
        if (!cacheRef.current.tournaments) promises.push(apiService.getTournaments());
        if (!cacheRef.current.games) promises.push(apiService.getGames());

        if (promises.length > 0) {
          const resultsArr = await Promise.allSettled(promises);
          // Assign back in order attempted
          let idx = 0;
          if (!cacheRef.current.users) {
            const r = resultsArr[idx++];
            if (r.status === 'fulfilled') {
              const list = Array.isArray(r.value) ? r.value : (r.value?.users || r.value?.data || r.value?.data?.users || r.value?.data?.data || []);
              cacheRef.current.users = Array.isArray(list) ? list : [];
            }
          }
          if (!cacheRef.current.teams) {
            const r = resultsArr[idx++];
            if (r.status === 'fulfilled') {
              const list = (r.value?.data?.teams) || r.value?.teams || [];
              cacheRef.current.teams = Array.isArray(list) ? list : [];
            }
          }
          if (!cacheRef.current.tournaments) {
            const r = resultsArr[idx++];
            if (r.status === 'fulfilled') {
              const list = r.value?.data || r.value?.tournaments || [];
              cacheRef.current.tournaments = Array.isArray(list) ? list : [];
            }
          }
          if (!cacheRef.current.games) {
            const r = resultsArr[idx++];
            if (r.status === 'fulfilled') {
              cacheRef.current.games = Array.isArray(r.value) ? r.value : (r.value?.data || []);
            }
          }
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
          placeholder="Search players, teams, tournaments, games..."
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
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-gray-400">{item.kind}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="px-4 py-2 bg-gray-50 text-[11px] text-gray-500">Press Enter to open • ESC to close</div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;


