import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService, type TeamSummary } from "../services/api";
import { getSocket } from "../services/socket";

type ChatListItem = {
  id: string;
  userAId: string;
  userBId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userA: { user_id: string; displayName: string; photo?: string | null };
  userB: { user_id: string; displayName: string; photo?: string | null };
  lastMessage?: {
    id: string;
    content: string;
    sentAt: string | Date;
    senderId: string;
  };
  unreadCount?: number;
};

type DirectMessage = {
  id: string;

  chatId: string;

  content: string;

  sentAt: string | Date;

  sender:
    | { user_id: string; displayName: string; photo?: string | null }
    | string;
};

type TeamMessage = {
  id: string;

  teamId: string;

  content: string;

  sentAt: string | Date;

  sender:
    | { user_id: string; displayName: string; photo?: string | null }
    | string;
};

export default function ChatPage() {
  const navigate = useNavigate();

  const { chatId: routeChatId, teamId: routeTeamId } = useParams();

  // Responsive state

  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  const isMobile = viewportWidth <= 768;

  const isTablet = viewportWidth > 768 && viewportWidth < 1200;

  const [activeTab, setActiveTab] = useState<"messages" | "teams">(() => {
    const url = new URL(window.location.href);

    const tab = url.searchParams.get("tab");

    return tab === "teams" ? "teams" : "messages";
  });

  const [loadingChats, setLoadingChats] = useState(false);

  const [loadingTeams, setLoadingTeams] = useState(false);

  const [chats, setChats] = useState<ChatListItem[]>([]);

  const [teams, setTeams] = useState<TeamSummary[]>([]);

  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 2000);
    return () => clearTimeout(t);
  }, [error]);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [conversation, setConversation] = useState<
    (DirectMessage | TeamMessage)[]
  >([]);

  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  const [messageInput, setMessageInput] = useState("");

  // Create Team modal state

  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);

  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  const [createTeamForm, setCreateTeamForm] = useState({
    title: "",

    gameName: "",

    description: "",

    photo: "",

    noOfPlayers: "" as string | number,

    isPublic: true,
  });

  const [createTeamPhotoPreview, setCreateTeamPhotoPreview] = useState<
    string | null
  >(null);

  const [availableGames, setAvailableGames] = useState<
    { id?: string; name: string }[]
  >([]);

  const [isLoadingGames, setIsLoadingGames] = useState(false);

  // Friends dropdown for starting new chat

  const [isFriendsDropdownOpen, setIsFriendsDropdownOpen] = useState(false);

  const [isLoadingFriends, setIsLoadingFriends] = useState(false);

  const [friends, setFriends] = useState<
    Array<{ user_id: string; displayName: string; photo?: string }>
  >([]);

  const [friendSearch, setFriendSearch] = useState("");

  // Team info panel state

  const [isTeamInfoOpen, setIsTeamInfoOpen] = useState(false);

  const [teamInfoTab, setTeamInfoTab] = useState<"overview" | "members">(
    "overview"
  );

  const [teamDetails, setTeamDetails] = useState<any | null>(null);

  const [isLoadingTeamDetails, setIsLoadingTeamDetails] = useState(false);

  const [isEditingTeamTitle, setIsEditingTeamTitle] = useState(false);

  const [isEditingTeamDescription, setIsEditingTeamDescription] =
    useState(false);

  const [editTeamTitle, setEditTeamTitle] = useState("");

  const [editTeamDescription, setEditTeamDescription] = useState("");

  const [memberSearch, setMemberSearch] = useState("");

  const [hoveredMemberId, setHoveredMemberId] = useState<string | null>(null);

  const [openMemberMenuId, setOpenMemberMenuId] = useState<string | null>(null);

  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(
    null
  );

  // Resolve teamMemberId by userId if needed (for stale/partial data)

  const resolveTeamMemberId = async (
    teamId: string,
    member: any
  ): Promise<string | null> => {
    try {
      const res = await apiService.getTeamMembers(teamId);

      const data = (res as any)?.data ?? res;

      const arr = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.members)
        ? (data as any).members
        : [];

      const targetUserId = member?.userId || member?.user?.user_id;

      const found = arr.find(
        (tm: any) =>
          tm.id === member?.id ||
          tm.userId === targetUserId ||
          tm.user?.user_id === targetUserId
      );

      return found?.id || null;
    } catch {
      return null;
    }
  };

  // Choose best identifier for member API calls

  const getMemberIdentifier = (member: any): string | null => {
    return (
      member?.id ||
      member?.memberId ||
      member?.userId ||
      member?.user?.user_id ||
      null
    );
  };

  // Search state

  const [messageSearch, setMessageSearch] = useState("");

  const [teamSearch, setTeamSearch] = useState("");

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const currentUserId = useMemo(() => apiService.getUserIdFromToken(), []);

  useEffect(() => {
    // Load both in parallel on first mount

    let cancelled = false;

    async function load() {
      setError(null);

      setLoadingChats(true);

      setLoadingTeams(true);

      try {
        const [chatsRes, myTeams] = await Promise.all([
          apiService.getUserChats(),

          apiService.getMyTeams(),
        ]);

        if (!cancelled) {
          const chatItems = (chatsRes.data as ChatListItem[]) || [];

          setChats(chatItems);

          setTeams(myTeams || []);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load data");
      } finally {
        if (!cancelled) {
          setLoadingChats(false);

          setLoadingTeams(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  // If friendId is present in query, open or create chat with that friend

  useEffect(() => {
    const url = new URL(window.location.href);

    const friendId = url.searchParams.get("friendId");

    if (!friendId) return;

    (async () => {
      try {
        const res = await apiService.getOrCreateChat(friendId);

        const chat = (res as any).data || res;

        const chatsRes = await apiService.getUserChats();

        const chatItems = (chatsRes as any).data || [];

        setChats(chatItems);

        setActiveTab("messages");

        setSelectedTeamId(null);

        setSelectedChatId(chat.id || chat.chatId || chat.chat?.id);

        setConversation([]);
      } catch (e: any) {
        setError(e?.message || "Failed to start chat");
      } finally {
        // Clean the query param to avoid repeat

        const cleaned = new URL(window.location.href);

        cleaned.searchParams.delete("friendId");

        window.history.replaceState({}, document.title, cleaned.toString());
      }
    })();
  }, []);

  // Keep the tab in the URL so refresh preserves current tab (only when not in a specific chat/team route)

  useEffect(() => {
    const url = new URL(window.location.href);

    // If viewing specific chat/team via path, don't change URL params here

    if (routeChatId || routeTeamId) return;

    if (activeTab === "teams") {
      url.searchParams.set("tab", "teams");
    } else {
      url.searchParams.delete("tab");
    }

    window.history.replaceState({}, document.title, url.toString());
  }, [activeTab, routeChatId, routeTeamId]);

  // Keep the URL in sync with current selection for all screen sizes

  useEffect(() => {
    if (activeTab === "messages" && selectedChatId) {
      navigate(`/chat/c/${encodeURIComponent(selectedChatId)}`, {
        replace: true,
      });
    } else if (activeTab === "teams" && selectedTeamId) {
      navigate(`/chat/t/${encodeURIComponent(selectedTeamId)}`, {
        replace: true,
      });
    } else if (!selectedChatId && !selectedTeamId) {
      navigate(`/chat`, { replace: true });
    }
  }, [activeTab, selectedChatId, selectedTeamId]);

  // Track viewport size for responsive layout adjustments

  useEffect(() => {
    function onResize() {
      setViewportWidth(window.innerWidth);
    }

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  // If route contains a chatId or teamId, select it (useful for mobile deep links). This persists on refresh too.

  useEffect(() => {
    if (routeChatId) {
      setActiveTab("messages");

      setSelectedTeamId(null);

      setSelectedChatId(routeChatId as string);
    } else if (routeTeamId) {
      setActiveTab("teams");

      setSelectedChatId(null);

      setSelectedTeamId(routeTeamId as string);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeChatId, routeTeamId]);

  // Load conversation when selection changes

  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      if (!selectedChatId && !selectedTeamId) return;

      setIsLoadingConversation(true);

      try {
        if (selectedChatId) {
          const res = await apiService.getChatMessages(selectedChatId, 50, 0);

          if (!cancelled) {
            const items = ((res.data as DirectMessage[]) || []).slice();
            items.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            // Ensure uniqueness by id
            const seen = new Set<string>();
            const deduped = items.filter((m: any) => {
              const id = String((m as any).id);
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            });
            setConversation(deduped);
          }
        } else if (selectedTeamId) {
          const res = await apiService.getTeamMessages(selectedTeamId);

          if (!cancelled) {
            const items = ((res.data as TeamMessage[]) || []).slice();
            items.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            const seen = new Set<string>();
            const deduped = items.filter((m: any) => {
              const id = String((m as any).id);
              if (seen.has(id)) return false;
              seen.add(id);
              return true;
            });
            setConversation(deduped);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load conversation");
      } finally {
        if (!cancelled) setIsLoadingConversation(false);
      }
    }

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [selectedChatId, selectedTeamId]);

  // Load games when create team modal opens

  useEffect(() => {
    let cancelled = false;

    async function loadGames() {
      if (!isCreateTeamOpen) return;

      setIsLoadingGames(true);

      try {
        const games = await apiService.getGames();

        if (!cancelled) setAvailableGames(games || []);
      } catch (e) {
        if (!cancelled) setAvailableGames([]);
      } finally {
        if (!cancelled) setIsLoadingGames(false);
      }
    }

    loadGames();

    return () => {
      cancelled = true;
    };
  }, [isCreateTeamOpen]);

  // Socket listeners

  useEffect(() => {
    const socket = getSocket();

    function onChatMessage(payload: any) {
      // If the incoming message belongs to currently open chat, append once and keep sorted
      if (selectedChatId && payload?.chatId === selectedChatId) {
        setConversation((prev) => {
          if (prev.some((m) => (m as any).id === payload.id)) return prev;
          const next = [
            ...prev,
            {
              id: payload.id,
              chatId: payload.chatId,
              content: payload.content,
              sentAt: payload.sentAt,
              sender: payload.sender,
            } as DirectMessage,
          ];
          next.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
          return next;
        });
      }

      // Update chat list lastMessage

      setChats((prev) =>
        prev.map((c) =>
          c.id === payload.chatId
            ? {
                ...c,

                lastMessage: {
                  id: payload.id,

                  content: payload.content,

                  sentAt: payload.sentAt,

                  senderId:
                    typeof payload.sender === "string"
                      ? payload.sender
                      : payload.sender?.user_id,
                },

                updatedAt: payload.sentAt,
              }
            : c
        )
      );
    }

    function onChatMessageSent(payload: any) {
      if (!selectedChatId || payload?.chatId !== selectedChatId) return;
      setConversation((prev) => {
        // Replace optimistic if present; otherwise ignore if already appended by 'chat:message'
        const idx = prev.findIndex((m) => (m as any).id === payload.id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...(next[idx] as any), sentAt: payload.sentAt };
        next.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        return next;
      });
    }

    function onTeamMessage(payload: any) {
      if (!selectedTeamId || payload?.teamId !== selectedTeamId) return;

      setConversation((prev) => {
        // Replace optimistic temp message if it exists, otherwise append once
        const idx = prev.findIndex((m) => (m as any).id === payload.id);
        const next = [...prev];
        if (idx !== -1) {
          next[idx] = {
            id: payload.id,
            teamId: payload.teamId,
            content: payload.content,
            sentAt: payload.sentAt,
            sender: payload.sender,
          } as TeamMessage;
        } else {
          next.push({
            id: payload.id,
            teamId: payload.teamId,
            content: payload.content,
            sentAt: payload.sentAt,
            sender: payload.sender,
          } as TeamMessage);
        }
        next.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
        return next;
      });
    }

    socket.on("chat:message", onChatMessage);

    socket.on("chat:message:sent", onChatMessageSent);

    socket.on("team:message", onTeamMessage);

    return () => {
      socket.off("chat:message", onChatMessage);

      socket.off("chat:message:sent", onChatMessageSent);

      socket.off("team:message", onTeamMessage);
    };
  }, [selectedChatId, selectedTeamId]);

  // Auto-scroll to bottom when conversation updates

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation]);

  // ESC key to exit active conversation back to list

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (selectedChatId || selectedTeamId) {
          setSelectedChatId(null);

          setSelectedTeamId(null);

          navigate("/chat", { replace: true });
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedChatId, selectedTeamId]);

  const recentChats = useMemo(() => {
    // Map chats to show the other participant and last message

    return chats.map((c) => {
      const other = c.userA.user_id === currentUserId ? c.userB : c.userA;

      return {
        id: c.id,

        name: other.displayName,

        photo: other.photo || undefined,

        lastMessage: c.lastMessage?.content || "",

        lastAt: c.lastMessage?.sentAt || c.updatedAt,

        unreadCount: (c as any).unreadCount || 0,
      };
    });
  }, [chats, currentUserId]);

  const filteredRecentChats = useMemo(() => {
    const q = messageSearch.trim().toLowerCase();

    if (!q) return recentChats;

    return recentChats.filter(
      (rc) =>
        rc.name?.toLowerCase().includes(q) ||
        rc.lastMessage?.toLowerCase().includes(q)
    );
  }, [recentChats, messageSearch]);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.trim().toLowerCase();

    if (!q) return teams;

    return teams.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        (t.gameName || "").toLowerCase().includes(q)
    );
  }, [teams, teamSearch]);

  const selectedHeader = useMemo(() => {
    if (activeTab === "messages" && selectedChatId) {
      const chat = chats.find((c) => c.id === selectedChatId);

      if (!chat) return { title: "Chat" };

      const other =
        chat.userA.user_id === currentUserId ? chat.userB : chat.userA;

      return { title: other.displayName, photo: other.photo || undefined };
    }

    if (activeTab === "teams" && selectedTeamId) {
      const team = teams.find((t) => t.id === selectedTeamId);

      if (!team) return { title: "Team" };

      return { title: team.title };
    }

    return null;
  }, [activeTab, selectedChatId, selectedTeamId, chats, teams, currentUserId]);

  // no-op placeholder removed

  async function handleSend() {
    const text = messageInput.trim();

    if (!text) return;

    try {
      if (activeTab === "messages" && selectedChatId) {
        // optimistic append with temp id

        const tempId = `temp-${Date.now()}`;

        const optimistic: DirectMessage = {
          id: tempId,

          chatId: selectedChatId,

          content: text,

          sentAt: new Date().toISOString(),

          sender: currentUserId || "me",
        } as any;

        setConversation((prev) => [...prev, optimistic]);

        setMessageInput("");

        const res = await apiService.sendMessage(selectedChatId, text);

        const saved = res.data;

        setConversation((prev) => {
          // If real message already arrived via socket, drop the temp
          const hasReal = prev.some((m) => (m as any).id === saved.id);
          if (hasReal) {
            const filtered = prev.filter((m) => (m as any).id !== tempId);
            filtered.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            return filtered;
          }
          const mapped = prev.map((m) =>
            (m as any).id === tempId
              ? ({
                  id: saved.id,
                  chatId: saved.chatId,
                  content: saved.content,
                  sentAt: saved.sentAt,
                  sender: saved.sender,
                } as DirectMessage)
              : m
          );
          mapped.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
          return mapped;
        });
      } else if (activeTab === "teams" && selectedTeamId) {
        const tempId = `temp-${Date.now()}`;

        const optimistic: TeamMessage = {
          id: tempId,

          teamId: selectedTeamId,

          content: text,

          sentAt: new Date().toISOString(),

          sender: currentUserId || "me",
        } as any;

        setConversation((prev) => [...prev, optimistic]);

        setMessageInput("");

        const res = await apiService.sendTeamMessage(selectedTeamId, text);

        const saved = res.data;

        setConversation((prev) => {
          // If real message already arrived via socket, drop the temp
          const hasReal = prev.some((m) => (m as any).id === saved.id);
          if (hasReal) {
            const filtered = prev.filter((m) => (m as any).id !== tempId);
            filtered.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
            return filtered;
          }
          const mapped = prev.map((m) =>
            (m as any).id === tempId
              ? ({
                  id: saved.id,
                  teamId: saved.teamId,
                  content: saved.content,
                  sentAt: saved.sentAt,
                  sender: saved.sender,
                } as TeamMessage)
              : m
          );
          mapped.sort((a: any, b: any) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime());
          return mapped;
        });
      }
    } catch (e: any) {
      setError(e?.message || "Failed to send message");
    }
  }

  const hasActiveConversation =
    !!selectedHeader || !!routeChatId || !!routeTeamId;

  const showListPanel = !(isMobile && hasActiveConversation);

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f6f6",
      }}
    >
      {error && (
        <div style={{ color: "#b91c1c", padding: "8px 16px" }}>{error}</div>
      )}

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left list - hidden on mobile when a conversation is open */}

        {showListPanel && (
          <div
            style={{
              width: isMobile ? "100%" : isTablet ? 320 : 360,
              borderRight: isMobile ? "none" : "1px solid #eee",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: 14,
                borderBottom: "1px solid #f2f2f2",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => navigate("/dashboard")}
                  title="Back"
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    lineHeight: "26px",
                    textAlign: "center",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: "#111827" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <span style={{ fontSize: 18 }}>Chats</span>
              </div>

              {activeTab === "messages" && (
                <div>
                  <button
                    onClick={async () => {
                      setIsFriendsDropdownOpen((prev) => !prev);

                      if (!isFriendsDropdownOpen && friends.length === 0) {
                        setIsLoadingFriends(true);

                        try {
                          const list = await apiService.listFriends();

                          setFriends(list || []);
                        } catch (e) {
                          setError(
                            (e as any)?.message || "Failed to load friends"
                          );
                        } finally {
                          setIsLoadingFriends(false);
                        }
                      }
                    }}
                    title="New chat"
                    style={{
                      border: "1px solid #e5e7eb",

                      background: "#fff",

                      borderRadius: 6,

                      width: 28,

                      height: 28,

                      lineHeight: "26px",

                      textAlign: "center",

                      cursor: "pointer",

                      color: "#111827",

                      fontWeight: 700,
                    }}
                  >
                    {isFriendsDropdownOpen ? "×" : "+"}
                  </button>

                  {isFriendsDropdownOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: 44,
                        left: 12,
                        right: 12,
                        background: "#fff",
                        border: "1px solid #eee",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                        borderRadius: 8,
                        zIndex: 40,
                        maxHeight: 280,
                        overflowY: "auto",
                      }}
                    >
                      <div
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #f2f2f2",
                          fontWeight: 600,
                          color: "#6b7280",
                        }}
                      >
                        Start new chat
                      </div>

                      <div
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #f2f2f2",
                        }}
                      >
                        <input
                          value={friendSearch}
                          onChange={(e) => setFriendSearch(e.target.value)}
                          placeholder="Search friends"
                          style={{
                            width: "100%",
                            border: "1px solid #e5e7eb",
                            borderRadius: 8,
                            padding: "8px 10px",
                            fontSize: 14,
                          }}
                        />
                      </div>

                      {isLoadingFriends ? (
                        <div style={{ padding: 12 }}>Loading…</div>
                      ) : friends.length === 0 ? (
                        <div style={{ padding: 12, color: "#6b7280" }}>
                          No friends found
                        </div>
                      ) : (
                        <ul
                          style={{ listStyle: "none", margin: 0, padding: 0 }}
                        >
                          {friends.filter((f) => {
                            const q = friendSearch.trim().toLowerCase();

                            if (!q) return true;

                            return (f.displayName || "")
                              .toLowerCase()
                              .includes(q);
                          }).length === 0 ? (
                            <li style={{ padding: 12, color: "#6b7280" }}>
                              No matches
                            </li>
                          ) : (
                            friends
                              .filter((f) => {
                                const q = friendSearch.trim().toLowerCase();

                                if (!q) return true;

                                return (f.displayName || "")
                                  .toLowerCase()
                                  .includes(q);
                              })
                              .map((f) => (
                                <li
                                  key={f.user_id}
                                  onClick={async () => {
                                    try {
                                      const res =
                                        await apiService.getOrCreateChat(
                                          f.user_id
                                        );

                                      const chat = (res.data as any) || res;

                                      const chatsRes =
                                        await apiService.getUserChats();

                                      const chatItems =
                                        (chatsRes.data as any[]) || [];

                                      setChats(chatItems);

                                      setActiveTab("messages");

                                      setSelectedTeamId(null);

                                      setSelectedChatId(
                                        chat.id || chat.chatId || chat.chat?.id
                                      );

                                      setConversation([]);

                                      setIsFriendsDropdownOpen(false);

                                      setFriendSearch("");
                                    } catch (e) {
                                      setError(
                                        (e as any)?.message ||
                                          "Failed to start chat"
                                      );
                                    }
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    padding: "10px 12px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #f6f6f6",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: "50%",
                                      background: "#e5e7eb",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {f.photo ? (
                                      <img
                                        src={f.photo}
                                        alt={f.displayName}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      <span style={{ fontWeight: 600 }}>
                                        {f.displayName?.[0] ?? "?"}
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ fontWeight: 600 }}>
                                    {f.displayName}
                                  </div>
                                </li>
                              ))
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #f2f2f2",
              }}
            >
              <button
                onClick={() => {
                  setActiveTab("messages");
                  setSelectedTeamId(null);
                  setSelectedChatId(null);
                  setConversation([]);
                }}
                style={{
                  flex: 1,

                  padding: "10px 12px",

                  border: "none",

                  borderRight: "1px solid #f2f2f2",

                  background: activeTab === "messages" ? "#e9f2ff" : "#fff",

                  color: activeTab === "messages" ? "#1d4ed8" : "#6b7280",

                  fontWeight: 600,

                  cursor: "pointer",
                }}
              >
                Messaging
              </button>

              <button
                onClick={() => {
                  setActiveTab("teams");
                  setSelectedChatId(null);
                  setConversation([]);
                }}
                style={{
                  flex: 1,

                  padding: "10px 12px",

                  border: "none",

                  background: activeTab === "teams" ? "#e9f2ff" : "#fff",

                  color: activeTab === "teams" ? "#1d4ed8" : "#6b7280",

                  fontWeight: 600,

                  cursor: "pointer",
                }}
              >
                Teams
              </button>
            </div>

            <div style={{ overflowY: "auto" }}>
              {activeTab === "messages" && (
                <>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderBottom: "1px solid #f2f2f2",
                      background: "#fff",
                    }}
                  >
                    <input
                      value={messageSearch}
                      onChange={(e) => setMessageSearch(e.target.value)}
                      placeholder="Search chats"
                      style={{
                        width: "100%",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: "10px 12px",
                      color: "#6b7280",
                      fontWeight: 700,
                      borderBottom: "1px solid #f2f2f2",
                      fontSize: 14,
                    }}
                  >
                    Recent chats
                  </div>

                  {loadingChats ? (
                    <div style={{ padding: 12 }}>Loading…</div>
                  ) : filteredRecentChats.length === 0 ? (
                    <div style={{ padding: 12 }}>No recent chats</div>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {filteredRecentChats.map((item) => (
                        <li
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,

                            padding: "10px 12px",
                            borderBottom: "1px solid #f6f6f6",

                            background:
                              selectedChatId === item.id
                                ? "#f9fafb"
                                : "transparent",

                            cursor: "pointer",
                          }}
                          onClick={async () => {
                            setSelectedChatId(item.id);

                            setSelectedTeamId(null);

                            try {
                              await apiService.markMessagesAsRead(item.id);

                              setChats((prev) =>
                                prev.map((c) =>
                                  c.id === item.id
                                    ? { ...c, unreadCount: 0 }
                                    : c
                                )
                              );
                            } catch {}
                          }}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              background: "#e5e7eb",

                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              overflow: "hidden",
                              flexShrink: 0,
                            }}
                          >
                            {item.photo ? (
                              <img
                                src={item.photo}
                                alt={item.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span style={{ fontWeight: 600 }}>
                                {item.name?.[0] ?? "?"}
                              </span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 8,
                              }}
                            >
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 16,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.name}
                              </div>

                              {item.unreadCount && item.unreadCount >= 1 ? (
                                <span
                                  style={{
                                    background: "#ef4444",
                                    color: "#fff",
                                    fontSize: 12,
                                    borderRadius: 9999,
                                    padding: "2px 8px",
                                    minWidth: 20,
                                    textAlign: "center",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.unreadCount}
                                </span>
                              ) : null}
                            </div>

                            <div
                              style={{
                                color: "#6b7280",
                                fontSize: 15,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {item.lastMessage}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {activeTab === "teams" && (
                <>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderBottom: "1px solid #f2f2f2",
                      background: "#fff",
                    }}
                  >
                    <input
                      value={teamSearch}
                      onChange={(e) => setTeamSearch(e.target.value)}
                      placeholder="Search teams"
                      style={{
                        width: "100%",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        padding: "8px 10px",
                        fontSize: 14,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      color: "#6b7280",
                      fontWeight: 600,
                      borderBottom: "1px solid #f2f2f2",
                    }}
                  >
                    <span>My Teams</span>

                    <button
                      onClick={() => setIsCreateTeamOpen(true)}
                      title="Create team"
                      style={{
                        border: "1px solid #e5e7eb",

                        background: "#fff",

                        borderRadius: 6,

                        width: 28,

                        height: 28,

                        lineHeight: "26px",

                        textAlign: "center",

                        cursor: "pointer",

                        color: "#111827",

                        fontWeight: 700,
                      }}
                    >
                      +
                    </button>
                  </div>

                  {loadingTeams ? (
                    <div style={{ padding: 12 }}>Loading…</div>
                  ) : filteredTeams.length === 0 ? (
                    <div style={{ padding: 12 }}>No teams</div>
                  ) : (
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {filteredTeams.map((team) => (
                        <li
                          key={team.id}
                          style={{
                            padding: "10px 12px",
                            borderBottom: "1px solid #f6f6f6",

                            background:
                              selectedTeamId === team.id
                                ? "#f9fafb"
                                : "transparent",

                            cursor: "pointer",
                          }}
                          onClick={() => {
                            setSelectedTeamId(team.id);
                            setSelectedChatId(null);
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <span>{team.title}</span>

                              {(team as any).isPublic === false ||
                              (team as any).privacy === "PRIVATE" ? (
                                <span
                                  title="Private team"
                                  aria-label="Private team"
                                >
                                  🔒
                                </span>
                              ) : null}
                            </div>

                            {(team as any).unreadCount &&
                            (team as any).unreadCount >= 1 ? (
                              <span
                                style={{
                                  background: "#ef4444",
                                  color: "#fff",
                                  fontSize: 12,
                                  borderRadius: 9999,
                                  padding: "2px 8px",
                                  minWidth: 20,
                                  textAlign: "center",
                                  fontWeight: 700,
                                }}
                              >
                                {(team as any).unreadCount}
                              </span>
                            ) : null}
                          </div>

                          {(team as any).gameName ||
                          (team as any).game?.name ? (
                            <div style={{ color: "#6b7280", fontSize: 14 }}>
                              {(team as any).gameName ||
                                (team as any).game?.name}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Right conversation - hidden entirely on mobile unless a conversation is active */}

        {(!isMobile || hasActiveConversation) && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              background: "#f5f6f6",
              position: "relative",
            }}
          >
            {selectedHeader ? (
              <>
                <div
                  style={{
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "#fff",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  {/* Mobile-only back button to list (go to chat list) */}

                  <button
                    onClick={() => {
                      setSelectedChatId(null);
                      setSelectedTeamId(null);
                      navigate("/chat", { replace: true });
                    }}
                    style={{
                      display: isMobile ? "inline-flex" : "none",
                      border: "1px solid #e5e7eb",
                      background: "#fff",
                      borderRadius: 6,
                      width: 28,
                      height: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ color: "#111827" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#e5e7eb",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {selectedHeader.photo ? (
                      <img
                        src={selectedHeader.photo as any}
                        alt={selectedHeader.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <span style={{ fontWeight: 700 }}>
                        {selectedHeader.title?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontWeight: 800,
                      fontSize: 18,
                      cursor: selectedTeamId ? "pointer" : selectedChatId ? "pointer" : "default",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    onClick={async () => {
                      if (selectedChatId) {
                        const chat = chats.find((c) => c.id === selectedChatId);
                        if (chat) {
                          const other = chat.userA.user_id === currentUserId ? chat.userB : chat.userA;
                          navigate(`/users/${other.user_id}`);
                          return;
                        }
                      }
                      if (!selectedTeamId) return;

                      setIsTeamInfoOpen(true);

                      setTeamInfoTab("overview");

                      setIsLoadingTeamDetails(true);

                      try {
                        const res = await apiService.getTeamById(
                          selectedTeamId
                        );

                        setTeamDetails((res as any).data || res);

                        setIsEditingTeamTitle(false);

                        setIsEditingTeamDescription(false);
                      } catch (e: any) {
                        setError(e?.message || "Failed to load team");

                        setTeamDetails(null);
                      } finally {
                        setIsLoadingTeamDetails(false);
                      }
                    }}
                    title={selectedTeamId ? "View team info" : undefined}
                  >
                    {selectedHeader.title}
                  </div>
                  <div style={{ flex: 1 }} />

                  {selectedTeamId && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={async () => {
                          try {
                            const shareUrl = `${window.location.origin}/team-invite/${encodeURIComponent(selectedTeamId)}`;
                            if ((navigator as any).share) {
                              await (navigator as any).share({ title: selectedHeader?.title, url: shareUrl });
                            } else {
                              await navigator.clipboard.writeText(shareUrl);
                              alert('Invite link copied');
                            }
                          } catch {}
                        }}
                        title="Share team"
                        style={{
                          border: "1px solid #e5e7eb",
                          background: "#fff",
                          borderRadius: 6,
                          padding: "6px 10px",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Share
                      </button>
                    </div>
                  )}
                </div>

                <div
                  ref={scrollRef}
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: 14,
                    background: "#f5f6f6",
                  }}
                >
                  {isLoadingConversation ? (
                    <div>Loading conversation…</div>
                  ) : conversation.length === 0 ? (
                    <div style={{ color: "#6b7280", fontSize: 15 }}>
                      No messages yet
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {conversation.map((m: any) => {
                        const isMine =
                          typeof m.sender === "string"
                            ? m.sender === currentUserId
                            : m.sender?.user_id === currentUserId;

                        return (
                          <div
                            key={m.id}
                            style={{
                              display: "flex",
                              justifyContent: isMine
                                ? "flex-end"
                                : "flex-start",
                            }}
                          >
                            <div
                              style={{
                                maxWidth: "72%",
                                padding: "10px 14px",
                                borderRadius: 14,

                                background: isMine ? "#dcf8c6" : "#fff",

                                border: "1px solid #e5e7eb",

                                whiteSpace: "pre-wrap",

                                wordBreak: "break-word",
                                fontSize: 15,
                              }}
                            >
                              {m.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    padding: 12,
                    borderTop: "1px solid #eee",
                    display: "flex",
                    gap: 10,
                    background: "#f5f6f6",
                  paddingBottom: isMobile
                    ? "calc(env(safe-area-inset-bottom, 0px) + 64px)"
                    : 12,
                  }}
                >
                  <input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                    placeholder={"Type a message"}
                    style={{
                      flex: 1,
                      border: "1px solid #ddd",
                      borderRadius: 22,
                      padding: "12px 16px",
                      fontSize: 15,
                    }}
                  />

                  <button
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    style={{
                      padding: "12px 18px",
                      borderRadius: 22,
                      border: "1px solid #111827",
                      background: "#111827",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            ) : isMobile ? (
              <div style={{ flex: 1, background: "#f5f6f6" }} />
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f5f6f6",
                }}
              >
                <div
                  style={{ textAlign: "center", color: "#4b5563", padding: 24 }}
                >
                  <div
                    style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}
                  >
                    Start a conversation
                  </div>

                  <div style={{ fontSize: 14 }}>
                    Select a chat from the left or tap the + to start a new one.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Info Panel (compact popover on desktop, full page on mobile) */}

      {isTeamInfoOpen &&
        selectedTeamId &&
        (isMobile ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              zIndex: 60,
            }}
          >
            <div
              style={{
                padding: 12,
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setIsTeamInfoOpen(false)}
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    lineHeight: "26px",
                    textAlign: "center",
                    cursor: "pointer",
                  }}
                >
                  {"←"}
                </button>

                <span style={{ fontWeight: 700 }}>Team Info</span>
              </div>
            </div>

            {error && (
              <div style={{ color: "#b91c1c", padding: "8px 16px" }}>{error}</div>
            )}

            {isLoadingTeamDetails ? (
              <div style={{ padding: 16 }}>Loading…</div>
            ) : !teamDetails ? (
              <div style={{ padding: 16, color: "#6b7280" }}>
                No team info available.
              </div>
            ) : (
              <div
                style={{
                  padding: 16,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
                onClick={() => {
                  if (openMemberMenuId) setOpenMemberMenuId(null);
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "#e5e7eb",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {teamDetails.photo ? (
                    <img
                      src={teamDetails.photo}
                      alt={teamDetails.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span style={{ fontWeight: 700 }}>
                      {(teamDetails.title || "?")[0]}
                    </span>
                  )}
                </div>

                {(() => {
                  const isAdmin =
                    teamDetails?.creatorId === currentUserId ||
                    (Array.isArray(teamDetails?.members) &&
                      teamDetails.members.some(
                        (m: any) =>
                          (m.userId === currentUserId || m.user?.user_id === currentUserId) &&
                          m.isAdmin
                      ));

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {isEditingTeamTitle ? (
                        <input
                          value={editTeamTitle}
                          onChange={(e) => setEditTeamTitle(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter" && selectedTeamId) {
                              const newTitle = editTeamTitle.trim();

                              try {
                                await apiService.updateTeam(selectedTeamId, { title: newTitle });

                                setTeamDetails((prev: any) => ({
                                  ...prev,
                                  title: newTitle,
                                }));

                                setTeams((prev) =>
                                  prev.map((t) => (t.id === selectedTeamId ? { ...t, title: newTitle } : t))
                                );

                                setIsEditingTeamTitle(false);
                              } catch (err: any) {
                                setError(err?.message || "Failed to update title");
                              }
                            } else if (e.key === "Escape") {
                              setIsEditingTeamTitle(false);
                            }
                          }}
                          autoFocus
                          style={{
                            fontWeight: 800,
                            fontSize: 20,
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            padding: "4px 8px",
                          }}
                        />
                      ) : (
                        <div style={{ fontWeight: 800, fontSize: 20 }}>{teamDetails.title}</div>
                      )}

                      {isAdmin && !isEditingTeamTitle && (
                        <button
                          title="Edit title"
                          onClick={() => {
                            setEditTeamTitle(teamDetails.title || "");
                            setIsEditingTeamTitle(true);
                          }}
                          style={{ border: "none", background: "transparent", cursor: "pointer" }}
                        >
                          ✎
                        </button>
                      )}
                    </div>
                  );
                })()}

                <div style={{ color: "#374151" }}>
                  {teamDetails.gameName || teamDetails.game?.name || "—"}
                </div>

                <div style={{ color: "#374151" }}>
                  Created:{" "}
                  {teamDetails.createdAt
                    ? new Date(teamDetails.createdAt).toLocaleString()
                    : "—"}
                </div>

                {(() => {
                  const isAdmin =
                    teamDetails?.creatorId === currentUserId ||
                    (Array.isArray(teamDetails?.members) &&
                      teamDetails.members.some(
                        (m: any) =>
                          (m.userId === currentUserId || m.user?.user_id === currentUserId) &&
                          m.isAdmin
                      ));

                  return (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {isEditingTeamDescription ? (
                        <input
                          value={editTeamDescription}
                          onChange={(e) => setEditTeamDescription(e.target.value)}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter" && selectedTeamId) {
                              const newDesc = editTeamDescription.trim();

                              try {
                                await apiService.updateTeam(selectedTeamId, { description: newDesc });

                                setTeamDetails((prev: any) => ({
                                  ...prev,
                                  description: newDesc,
                                }));

                                setTeams((prev) =>
                                  prev.map((t) => (t.id === selectedTeamId ? { ...t, description: newDesc } : t))
                                );

                                setIsEditingTeamDescription(false);
                              } catch (err: any) {
                                setError(err?.message || "Failed to update description");
                              }
                            } else if (e.key === "Escape") {
                              setIsEditingTeamDescription(false);
                            }
                          }}
                          autoFocus
                          placeholder="Add description"
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            padding: "6px 8px",
                            width: "100%",
                          }}
                        />
                      ) : (
                        <div style={{ color: "#374151" }}>
                          {teamDetails.description || "Add description"}
                        </div>
                      )}

                      {isAdmin && !isEditingTeamDescription && (
                        <button
                          title="Edit description"
                          onClick={() => {
                            setEditTeamDescription(teamDetails.description || "");
                            setIsEditingTeamDescription(true);
                          }}
                          style={{ border: "none", background: "transparent", cursor: "pointer" }}
                        >
                          ✎
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Actions: Exit and Delete/Exit (mobile team info - below description) */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    onClick={async () => {
                      if (!selectedTeamId) return;
                      try {
                        await apiService.leaveTeam(selectedTeamId);
                        setTeams((prev) => prev.filter((t) => t.id !== selectedTeamId));
                        setIsTeamInfoOpen(false);
                        setSelectedTeamId(null);
                        setSelectedChatId(null);
                        setActiveTab('teams');
                        navigate('/chat', { replace: true });
                      } catch (e: any) {
                        setError(e?.message || "Failed to leave team");
                      }
                    }}
                    style={{
                      padding: "6px 10px",
                      fontSize: 13,
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Exit team
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedTeamId) return;
                      if (!confirm('Are you sure you want to delete this team?')) return;
                      try {
                        try {
                          await apiService.deleteTeam(selectedTeamId);
                        } catch (_) {
                          await apiService.leaveTeam(selectedTeamId);
                        }
                        setTeams((prev) => prev.filter((t) => t.id !== selectedTeamId));
                        setIsTeamInfoOpen(false);
                        setSelectedTeamId(null);
                        setSelectedChatId(null);
                        setActiveTab('teams');
                        navigate('/chat', { replace: true });
                      } catch (e: any) {
                        setError(e?.message || "Failed to delete/exit team");
                      }
                    }}
                    style={{
                      padding: "6px 10px",
                      fontSize: 13,
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      borderRadius: 6,
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Delete / Exit
                  </button>
                </div>

                <div style={{ marginTop: 8, fontWeight: 700 }}>Members</div>

                <div>
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members"
                    style={{
                      width: "100%",
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "8px 10px",
                      fontSize: 14,
                    }}
                  />
                </div>

                {Array.isArray(teamDetails.members) &&
                teamDetails.members.length > 0 ? (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {teamDetails.members
                      .filter((m: any) => {
                        const q = memberSearch.trim().toLowerCase();

                        if (!q) return true;

                        return (m.displayName || "").toLowerCase().includes(q);
                      })
                      .map((m: any) => (
                        <li
                          key={m.id}
                          onMouseEnter={() => setHoveredMemberId(m.id)}
                          onMouseLeave={() => {
                            if (openMemberMenuId !== m.id)
                              setHoveredMemberId(null);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 0",
                            borderBottom: "1px solid #f3f4f6",
                            position: "relative",
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#e5e7eb",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {m.photo ? (
                              <img
                                src={m.photo}
                                alt={m.displayName}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <span style={{ fontWeight: 700 }}>
                                {(m.displayName || "?")[0]}
                              </span>
                            )}
                          </div>

                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                {m.displayName}
                              </span>

                              {m.isAdmin ? (
                                <span
                                  style={{
                                    background: "#e0e7ff",
                                    color: "#1d4ed8",
                                    fontSize: 12,
                                    borderRadius: 9999,
                                    padding: "2px 8px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Admin
                                </span>
                              ) : null}
                            </div>

                            {(() => {
                              const isCurrentUserAdmin =
                                teamDetails?.creatorId === currentUserId ||
                                (Array.isArray(teamDetails?.members) &&
                                  teamDetails.members.some(
                                    (mm: any) =>
                                      (mm.userId === currentUserId ||
                                        mm.user?.user_id === currentUserId) &&
                                      mm.isAdmin
                                  ));

                              const showMenu = isCurrentUserAdmin;

                              return showMenu ? (
                                <div style={{ position: "relative" }}>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMemberMenuId((prev) =>
                                        prev === m.id ? null : m.id
                                      );
                                    }}
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      cursor: "pointer",
                                      visibility:
                                        hoveredMemberId === m.id ||
                                        openMemberMenuId === m.id ||
                                        (isMobile || isTablet)
                                          ? "visible"
                                          : "hidden",
                                    }}
                                  >
                                    ⋮
                                  </button>

                                  {openMemberMenuId === m.id && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      style={{
                                        position: "absolute",
                                        right: 0,
                                        bottom: 28,
                                        background: "#fff",
                                        border: "1px solid #eee",
                                        borderRadius: 6,
                                        boxShadow:
                                          "0 8px 20px rgba(0,0,0,0.08)",
                                        minWidth: 160,
                                        zIndex: 80,
                                      }}
                                    >
                                      {m.isAdmin ? (
                                        <button
                                          disabled={
                                            memberActionLoading ===
                                            "dismiss:" + m.id
                                          }
                                          onClick={async () => {
                                            try {
                                              setMemberActionLoading(
                                                "dismiss:" + m.id
                                              );

                                              await apiService.updateMemberAdmin(
                                                selectedTeamId as string,
                                                m.id,
                                                false
                                              );

                                              setTeamDetails((prev: any) => ({
                                                ...prev,
                                                members: prev.members.map(
                                                  (mm: any) =>
                                                    mm.id === m.id
                                                      ? { ...mm, isAdmin: false }
                                                      : mm
                                                ),
                                              }));

                                              setOpenMemberMenuId(null);
                                            } catch (err: any) {
                                              setError(
                                                err?.message ||
                                                  "Failed to dismiss admin"
                                              );
                                            } finally {
                                              setMemberActionLoading(null);
                                            }
                                          }}
                                          style={{
                                            display: "block",
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "8px 10px",
                                            border: "none",
                                            background: "#fff",
                                            cursor: "pointer",
                                            color: "#b45309",
                                          }}
                                        >
                                          Dismiss admin
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            disabled={
                                              memberActionLoading ===
                                              "admin:" + m.id
                                            }
                                            onClick={async () => {
                                              try {
                                                setMemberActionLoading(
                                                  "admin:" + m.id
                                                );

                                                await apiService.makeMemberAdmin(
                                                  selectedTeamId as string,
                                                  m.id
                                                );

                                                setTeamDetails((prev: any) => ({
                                                  ...prev,
                                                  members: prev.members.map(
                                                    (mm: any) =>
                                                      mm.id === m.id
                                                        ? { ...mm, isAdmin: true }
                                                        : mm
                                                  ),
                                                }));

                                                setOpenMemberMenuId(null);
                                              } catch (err: any) {
                                                setError(
                                                  err?.message ||
                                                    "Failed to make admin"
                                                );
                                              } finally {
                                                setMemberActionLoading(null);
                                              }
                                            }}
                                            style={{
                                              display: "block",
                                              width: "100%",
                                              textAlign: "left",
                                              padding: "8px 10px",
                                              border: "none",
                                              background: "#fff",
                                              cursor: "pointer",
                                            }}
                                          >
                                            Make admin
                                          </button>

                                          <button
                                            disabled={
                                              memberActionLoading ===
                                              "remove:" + m.id
                                            }
                                            onClick={async () => {
                                              try {
                                                setMemberActionLoading(
                                                  "remove:" + m.id
                                                );

                                                await apiService.removeMemberFromTeam(
                                                  selectedTeamId as string,
                                                  m.id
                                                );

                                                setTeamDetails((prev: any) => ({
                                                  ...prev,
                                                  members: prev.members.filter(
                                                    (mm: any) => mm.id !== m.id
                                                  ),
                                                }));

                                                setOpenMemberMenuId(null);
                                              } catch (err: any) {
                                                setError(
                                                  err?.message ||
                                                    "Failed to remove member"
                                                );
                                              } finally {
                                                setMemberActionLoading(null);
                                              }
                                            }}
                                            style={{
                                              display: "block",
                                              width: "100%",
                                              textAlign: "left",
                                              padding: "8px 10px",
                                              border: "none",
                                              background: "#fff",
                                              cursor: "pointer",
                                              color: "#b91c1c",
                                            }}
                                          >
                                            Remove from group
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : null;
                            })()}
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div style={{ color: "#6b7280" }}>No members to show.</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            <div
              onClick={() => {
                setOpenMemberMenuId(null);
                setIsTeamInfoOpen(false);
              }}
              style={{ position: "fixed", inset: 0, zIndex: 59, background: "transparent" }}
            />
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 56,
                left: 360,
                width: 700,
                height: "70%",
                minWidth: 640,
                minHeight: 420,
                background: "#fff",
                border: "1px solid #eee",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                borderRadius: 10,
                zIndex: 60,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: 12,
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: 700 }}>Team Info</span>

                <button
                  onClick={() => {
                    setOpenMemberMenuId(null);
                    setIsTeamInfoOpen(false);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  ×
                </button>
              </div>

              {isLoadingTeamDetails ? (
                <div style={{ padding: 16 }}>Loading…</div>
              ) : !teamDetails ? (
                <div style={{ padding: 16, color: "#6b7280" }}>
                  No team info available.
                </div>
              ) : (
                <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
                  <div
                    style={{
                      width: 220,
                      borderRight: "1px solid #f2f2f2",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <button
                      onClick={() => setTeamInfoTab("overview")}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        border: "none",
                        background:
                          teamInfoTab === "overview" ? "#eef2ff" : "#fff",
                        color: teamInfoTab === "overview" ? "#1d4ed8" : "#374151",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Overview
                    </button>

                    <button
                      onClick={() => setTeamInfoTab("members")}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        border: "none",
                        background:
                          teamInfoTab === "members" ? "#eef2ff" : "#fff",
                        color: teamInfoTab === "members" ? "#1d4ed8" : "#374151",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Members
                    </button>
                  </div>

                  <div
                    style={{ flex: 1, overflowY: "auto" }}
                    onClick={(e) => {
                      if (openMemberMenuId) setOpenMemberMenuId(null);
                      if (e.currentTarget === e.target) {
                        setIsTeamInfoOpen(false);
                      }
                    }}
                  >
                    {teamInfoTab === "overview" ? (
                      <div
                        style={{
                          padding: 16,
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: "50%",
                            background: "#e5e7eb",
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {teamDetails.photo ? (
                            <img
                              src={teamDetails.photo}
                              alt={teamDetails.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <span style={{ fontWeight: 700 }}>
                              {(teamDetails.title || "?")[0]}
                            </span>
                          )}
                        </div>

                        {(() => {
                          const isAdmin =
                            teamDetails?.creatorId === currentUserId ||
                            (Array.isArray(teamDetails?.members) &&
                              teamDetails.members.some(
                                (m: any) =>
                                  (m.userId === currentUserId ||
                                    m.user?.user_id === currentUserId) &&
                                  m.isAdmin
                              ));

                          return (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              {isEditingTeamTitle ? (
                                <input
                                  value={editTeamTitle}
                                  onChange={(e) => setEditTeamTitle(e.target.value)}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter" && selectedTeamId) {
                                      const newTitle = editTeamTitle.trim();

                                      try {
                                        await apiService.updateTeam(
                                          selectedTeamId,
                                          { title: newTitle }
                                        );

                                        setTeamDetails((prev: any) => ({
                                          ...prev,
                                          title: newTitle,
                                        }));

                                        setTeams((prev) =>
                                          prev.map((t) =>
                                            t.id === selectedTeamId
                                              ? { ...t, title: newTitle }
                                              : t
                                          )
                                        );

                                        setIsEditingTeamTitle(false);
                                      } catch (err: any) {
                                        setError(
                                          err?.message || "Failed to update title"
                                        );
                                      }
                                    } else if (e.key === "Escape") {
                                      setIsEditingTeamTitle(false);
                                    }
                                  }}
                                  autoFocus
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 20,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 6,
                                    padding: "4px 8px",
                                  }}
                                />
                              ) : (
                                <div style={{ fontWeight: 800, fontSize: 20 }}>
                                  {teamDetails.title}
                                </div>
                              )}

                              {isAdmin && !isEditingTeamTitle && (
                                <button
                                  title="Edit title"
                                  onClick={() => {
                                    setEditTeamTitle(teamDetails.title || "");
                                    setIsEditingTeamTitle(true);
                                  }}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                  }}
                                >
                                  ✎
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        <div style={{ color: "#374151" }}>
                          Game:{" "}
                          {teamDetails.gameName || teamDetails.game?.name || "—"}
                        </div>

                        <div style={{ color: "#374151" }}>
                          Created:{" "}
                          {teamDetails.createdAt
                            ? new Date(teamDetails.createdAt).toLocaleString()
                            : "—"}
                        </div>

                        {(() => {
                          const isAdmin =
                            teamDetails?.creatorId === currentUserId ||
                            (Array.isArray(teamDetails?.members) &&
                              teamDetails.members.some(
                                (m: any) =>
                                  (m.userId === currentUserId ||
                                    m.user?.user_id === currentUserId) &&
                                  m.isAdmin
                              ));

                          return (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                              }}
                            >
                              {isEditingTeamDescription ? (
                                <input
                                  value={editTeamDescription}
                                  onChange={(e) => setEditTeamDescription(e.target.value)}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter" && selectedTeamId) {
                                      const newDesc = editTeamDescription.trim();

                                      try {
                                        await apiService.updateTeam(
                                          selectedTeamId,
                                          { description: newDesc }
                                        );

                                        setTeamDetails((prev: any) => ({
                                          ...prev,
                                          description: newDesc,
                                        }));

                                        setTeams((prev) =>
                                          prev.map((t) =>
                                            t.id === selectedTeamId
                                              ? { ...t, description: newDesc }
                                              : t
                                          )
                                        );

                                        setIsEditingTeamDescription(false);
                                      } catch (err: any) {
                                        setError(
                                          err?.message ||
                                            "Failed to update description"
                                        );
                                      }
                                    } else if (e.key === "Escape") {
                                      setIsEditingTeamDescription(false);
                                    }
                                  }}
                                  autoFocus
                                  placeholder="Add description"
                                  style={{
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 6,
                                    padding: "6px 8px",
                                    width: "100%",
                                  }}
                                />
                              ) : (
                                <div style={{ color: "#374151" }}>
                                  Description:{" "}
                                  {teamDetails.description || "Add description"}
                                </div>
                              )}

                              {isAdmin && !isEditingTeamDescription && (
                                <button
                                  title="Edit description"
                                  onClick={() => {
                                    setEditTeamDescription(
                                      teamDetails.description || ""
                                    );
                                    setIsEditingTeamDescription(true);
                                  }}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                  }}
                                >
                                  ✎
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        {/* Actions: Exit and Delete/Exit (moved below description) */}
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <button
                            onClick={async () => {
                              if (!selectedTeamId) return;
                              try {
                                await apiService.leaveTeam(selectedTeamId);
                                setTeams((prev) => prev.filter((t) => t.id !== selectedTeamId));
                                setIsTeamInfoOpen(false);
                                setSelectedTeamId(null);
                              } catch (e: any) {
                                setError(e?.message || "Failed to leave team");
                              }
                            }}
                            style={{
                              padding: "6px 10px",
                              fontSize: 13,
                              border: "1px solid #d1d5db",
                              borderRadius: 6,
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Exit team
                          </button>
                          <button
                            onClick={async () => {
                              if (!selectedTeamId) return;
                              if (!confirm('Are you sure you want to delete this team?')) return;
                              try {
                                try {
                                  await apiService.deleteTeam(selectedTeamId);
                                } catch (_) {
                                  await apiService.leaveTeam(selectedTeamId);
                                }
                                setTeams((prev) => prev.filter((t) => t.id !== selectedTeamId));
                                setIsTeamInfoOpen(false);
                                setSelectedTeamId(null);
                              } catch (e: any) {
                                setError(e?.message || "Failed to delete/exit team");
                              }
                            }}
                            style={{
                              padding: "6px 10px",
                              fontSize: 13,
                              border: "1px solid #fecaca",
                              color: "#dc2626",
                              borderRadius: 6,
                              background: "#fff",
                              cursor: "pointer",
                            }}
                          >
                            Delete / Exit
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{ padding: 16 }}
                        onClick={(e) => {
                          if (openMemberMenuId) setOpenMemberMenuId(null);
                          if (e.currentTarget === e.target) setIsTeamInfoOpen(false);
                        }}
                      >
                        <div style={{ marginBottom: 10 }}>
                          <input
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            placeholder="Search members"
                            style={{
                              width: "100%",
                              border: "1px solid #e5e7eb",
                              borderRadius: 8,
                              padding: "8px 10px",
                              fontSize: 14,
                            }}
                          />
                        </div>

                        {Array.isArray(teamDetails.members) &&
                        teamDetails.members.length > 0 ? (
                          <ul
                            style={{ listStyle: "none", padding: 0, margin: 0 }}
                          >
                            {teamDetails.members
                              .filter((m: any) => {
                                const q = memberSearch.trim().toLowerCase();

                                if (!q) return true;

                                return (m.displayName || "")
                                  .toLowerCase()
                                  .includes(q);
                              })
                              .map((m: any) => (
                                <li
                                  key={m.id}
                                  onMouseEnter={() => setHoveredMemberId(m.id)}
                                  onMouseLeave={() => {
                                    if (openMemberMenuId !== m.id)
                                      setHoveredMemberId(null);
                                  }}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 0",
                                    borderBottom: "1px solid #f3f4f6",
                                    position: "relative",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: "50%",
                                      background: "#e5e7eb",
                                      overflow: "hidden",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    {m.photo ? (
                                      <img
                                        src={m.photo}
                                        alt={m.displayName}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                      />
                                    ) : (
                                      <span style={{ fontWeight: 700 }}>
                                        {(m.displayName || "?")[0]}
                                      </span>
                                    )}
                                  </div>

                                  <div
                                    style={{
                                      flex: 1,
                                      minWidth: 0,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                      }}
                                    >
                                      <span style={{ fontWeight: 600 }}>
                                        {m.displayName}
                                      </span>

                                      {m.isAdmin ? (
                                        <span
                                          style={{
                                            background: "#e0e7ff",
                                            color: "#1d4ed8",
                                            fontSize: 12,
                                            borderRadius: 9999,
                                            padding: "2px 8px",
                                            fontWeight: 700,
                                          }}
                                        >
                                          Admin
                                        </span>
                                      ) : null}
                                    </div>

                                    {(() => {
                                      const isCurrentUserAdmin =
                                        teamDetails?.creatorId === currentUserId ||
                                        (Array.isArray(teamDetails?.members) &&
                                          teamDetails.members.some(
                                            (mm: any) =>
                                              (mm.userId === currentUserId ||
                                                mm.user?.user_id === currentUserId) &&
                                              mm.isAdmin
                                          ));

                                      const showMenu = isCurrentUserAdmin;

                                      return showMenu ? (
                                        <div style={{ position: "relative" }}>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMemberMenuId((prev) =>
                                                prev === m.id ? null : m.id
                                              );
                                            }}
                                            style={{
                                              border: "none",
                                              background: "transparent",
                                              cursor: "pointer",
                                              visibility:
                                                hoveredMemberId === m.id ||
                                                openMemberMenuId === m.id ||
                                                (isMobile || isTablet)
                                                  ? "visible"
                                                  : "hidden",
                                            }}
                                          >
                                            ⋮
                                          </button>

                                          {openMemberMenuId === m.id && (
                                            <div
                                              onClick={(e) => e.stopPropagation()}
                                              style={{
                                                position: "absolute",
                                                right: 0,
                                                top: 24,
                                                background: "#fff",
                                                border: "1px solid #eee",
                                                borderRadius: 6,
                                                boxShadow:
                                                  "0 8px 20px rgba(0,0,0,0.08)",
                                                minWidth: 160,
                                                zIndex: 80,
                                              }}
                                            >
                                              {m.isAdmin ? (
                                                <button
                                                  disabled={
                                                    memberActionLoading ===
                                                    "dismiss:" + m.id
                                                  }
                                                  onClick={async () => {
                                                    try {
                                                      setMemberActionLoading(
                                                        "dismiss:" + m.id
                                                      );

                                                      await apiService.updateMemberAdmin(
                                                        selectedTeamId as string,
                                                        m.id,
                                                        false
                                                      );

                                                      setTeamDetails((prev: any) => ({
                                                        ...prev,
                                                        members: prev.members.map(
                                                          (mm: any) =>
                                                            mm.id === m.id
                                                              ? { ...mm, isAdmin: false }
                                                              : mm
                                                        ),
                                                      }));

                                                      setOpenMemberMenuId(null);
                                                    } catch (err: any) {
                                                      setError(
                                                        err?.message ||
                                                          "Failed to dismiss admin"
                                                      );
                                                    } finally {
                                                      setMemberActionLoading(null);
                                                    }
                                                  }}
                                                  style={{
                                                    display: "block",
                                                    width: "100%",
                                                    textAlign: "left",
                                                    padding: "8px 10px",
                                                    border: "none",
                                                    background: "#fff",
                                                    cursor: "pointer",
                                                    color: "#b45309",
                                                  }}
                                                >
                                                  Dismiss admin
                                                </button>
                                              ) : (
                                                <>
                                                  <button
                                                    disabled={
                                                      memberActionLoading ===
                                                      "admin:" + m.id
                                                    }
                                                    onClick={async () => {
                                                      try {
                                                        setMemberActionLoading(
                                                          "admin:" + m.id
                                                        );

                                                        await apiService.makeMemberAdmin(
                                                          selectedTeamId as string,
                                                          m.id
                                                        );

                                                        setTeamDetails((prev: any) => ({
                                                          ...prev,
                                                          members: prev.members.map(
                                                            (mm: any) =>
                                                              mm.id === m.id
                                                                ? { ...mm, isAdmin: true }
                                                                : mm
                                                          ),
                                                        }));

                                                        setOpenMemberMenuId(null);
                                                      } catch (err: any) {
                                                        setError(
                                                          err?.message ||
                                                            "Failed to make admin"
                                                        );
                                                      } finally {
                                                        setMemberActionLoading(null);
                                                      }
                                                    }}
                                                    style={{
                                                      display: "block",
                                                      width: "100%",
                                                      textAlign: "left",
                                                      padding: "8px 10px",
                                                      border: "none",
                                                      background: "#fff",
                                                      cursor: "pointer",
                                                    }}
                                                  >
                                                    Make admin
                                                  </button>

                                                  <button
                                                    disabled={
                                                      memberActionLoading ===
                                                      "remove:" + m.id
                                                    }
                                                    onClick={async () => {
                                                      try {
                                                        setMemberActionLoading(
                                                          "remove:" + m.id
                                                        );

                                                        await apiService.removeMemberFromTeam(
                                                          selectedTeamId as string,
                                                          m.id
                                                        );

                                                        setTeamDetails((prev: any) => ({
                                                          ...prev,
                                                          members: prev.members.filter(
                                                            (mm: any) => mm.id !== m.id
                                                          ),
                                                        }));

                                                        setOpenMemberMenuId(null);
                                                      } catch (err: any) {
                                                        setError(
                                                          err?.message ||
                                                            "Failed to remove member"
                                                        );
                                                      } finally {
                                                        setMemberActionLoading(null);
                                                      }
                                                    }}
                                                    style={{
                                                      display: "block",
                                                      width: "100%",
                                                      textAlign: "left",
                                                      padding: "8px 10px",
                                                      border: "none",
                                                      background: "#fff",
                                                      cursor: "pointer",
                                                      color: "#b91c1c",
                                                    }}
                                                  >
                                                    Remove from group
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      ) : null;
                                    })()}
                                  </div>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <div style={{ color: "#6b7280" }}>No members to show.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        ))}

      {/* Create Team Modal */}

      {isCreateTeamOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: 420,
              background: "#fff",
              borderRadius: 8,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                padding: 16,
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: 700 }}>Create Team</div>

              <button
                onClick={() => setIsCreateTeamOpen(false)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 18,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 14, color: "#374151" }}>
                  Title<span style={{ color: "#b91c1c" }}> *</span>
                </label>

                <input
                  value={createTeamForm.title}
                  onChange={(e) =>
                    setCreateTeamForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Team title"
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: "10px 12px",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 14, color: "#374151" }}>
                  Game<span style={{ color: "#b91c1c" }}> *</span>
                </label>

                <select
                  value={createTeamForm.gameName}
                  onChange={(e) =>
                    setCreateTeamForm((prev) => ({
                      ...prev,
                      gameName: e.target.value,
                    }))
                  }
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: "10px 12px",
                    background: "#fff",
                  }}
                >
                  <option value="" disabled>
                    {isLoadingGames ? "Loading games…" : "Select a game"}
                  </option>

                  {availableGames.map((g) => (
                    <option key={g.id || g.name} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 14, color: "#374151" }}>
                  Description
                </label>

                <textarea
                  value={createTeamForm.description}
                  onChange={(e) =>
                    setCreateTeamForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="What is this team about?"
                  rows={3}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 14, color: "#374151" }}>
                  Team Photo
                </label>

                {createTeamPhotoPreview && (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      background: "#e5e7eb",
                      overflow: "hidden",
                      marginBottom: 8,
                    }}
                  >
                    <img
                      src={createTeamPhotoPreview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (!file) return;

                    const reader = new FileReader();

                    reader.onload = () => {
                      const dataUrl = String(reader.result || "");

                      setCreateTeamForm((prev) => ({
                        ...prev,
                        photo: dataUrl,
                      }));

                      setCreateTeamPhotoPreview(dataUrl);
                    };

                    reader.readAsDataURL(file);
                  }}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 6,
                    padding: "8px 10px",
                  }}
                />

                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Upload a team image (JPG, PNG). Optional.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <label style={{ fontSize: 14, color: "#374151" }}>
                    Number of Players
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={createTeamForm.noOfPlayers}
                    onChange={(e) =>
                      setCreateTeamForm((prev) => ({
                        ...prev,
                        noOfPlayers: e.target.value,
                      }))
                    }
                    placeholder="e.g., 5"
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      padding: "10px 12px",
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    id="isPublic"
                    type="checkbox"
                    checked={createTeamForm.isPublic}
                    onChange={(e) =>
                      setCreateTeamForm((prev) => ({
                        ...prev,
                        isPublic: e.target.checked,
                      }))
                    }
                  />

                  <label htmlFor="isPublic" style={{ color: "#374151" }}>
                    Public team
                  </label>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 16,
                borderTop: "1px solid #eee",
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => setIsCreateTeamOpen(false)}
                disabled={isCreatingTeam}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                onClick={async () => {
                  const title = createTeamForm.title.trim();

                  const gameName = createTeamForm.gameName.trim();

                  if (!title || !gameName) {
                    setError("Title and Game Name are required");

                    return;
                  }

                  setIsCreatingTeam(true);

                  try {
                    await apiService.createTeam({
                      title,

                      gameName,

                      description:
                        createTeamForm.description.trim() || undefined,

                      photo: createTeamForm.photo.trim() || undefined,

                      noOfPlayers: createTeamForm.noOfPlayers
                        ? Number(createTeamForm.noOfPlayers)
                        : undefined,

                      isPublic: createTeamForm.isPublic,
                    });

                    const myTeams = await apiService.getMyTeams();

                    setTeams(myTeams || []);

                    setIsCreateTeamOpen(false);

                    setCreateTeamForm({
                      title: "",
                      gameName: "",
                      description: "",
                      photo: "",
                      noOfPlayers: "",
                      isPublic: true,
                    });

                    setCreateTeamPhotoPreview(null);
                  } catch (e: any) {
                    setError(e?.message || "Failed to create team");
                  } finally {
                    setIsCreatingTeam(false);
                  }
                }}
                disabled={isCreatingTeam}
                style={{
                  padding: "8px 12px",
                  border: "1px solid #111827",
                  background: "#111827",
                  color: "#fff",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {isCreatingTeam ? "Creating…" : "Create Team"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-20">
        <div className="flex justify-around items-center h-14">
          <button onClick={() => navigate('/chat')} className="-mt-6 bg-blue-600 text-white rounded-full p-4 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4-.8L3 20l.8-3.2A8.96 8.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          <button onClick={() => navigate('/dashboard')} className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M13 5v6a2 2 0 002 2h3m-9 4h6m-6 0a2 2 0 01-2-2v-3m8 5a2 2 0 002-2v-3m0 0l2-2m-2 2l-2 2" />
            </svg>
            <span className="text-xs">Home</span>
          </button>
          <button onClick={() => navigate('/tournaments')} className="flex flex-col items-center text-gray-600 hover:text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs">Tournaments</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
