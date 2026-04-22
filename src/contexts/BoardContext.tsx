import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type BoardSession,
  type BoardMember,
  type BoardBrief,
  type SeatRole,
  type DiscussionTurn,
  type DecisionOutcome,
  type DepthMode,
  type BoardStatus,
  createBoardSession,
  createBoardMember,
  createDiscussionTurn,
  generateId,
} from "@/lib/boards";

const STORAGE_KEY = "perskill_boards";

interface BoardContextValue {
  sessions: BoardSession[];
  createSession: (overrides?: Partial<BoardSession>) => BoardSession;
  getSession: (id: string) => BoardSession | undefined;
  updateSession: (id: string, updates: Partial<BoardSession>) => void;
  deleteSession: (id: string) => void;
  duplicateSession: (id: string) => BoardSession;
  addMember: (sessionId: string, personaId: string, role?: SeatRole) => void;
  removeMember: (sessionId: string, memberId: string) => void;
  updateMember: (sessionId: string, memberId: string, updates: Partial<BoardMember>) => void;
  setBrief: (sessionId: string, brief: Partial<BoardBrief>) => void;
  setMode: (sessionId: string, mode: DepthMode) => void;
  setStatus: (sessionId: string, status: BoardStatus) => void;
  addTurn: (sessionId: string, turn: Omit<DiscussionTurn, "id" | "createdAt">) => void;
  setOutcome: (sessionId: string, outcome: DecisionOutcome) => void;
  // Pre-filled creation helpers
  createSessionFromPersonas: (personaIds: string[]) => BoardSession;
}

const BoardContext = createContext<BoardContextValue | null>(null);

function loadSessions(): BoardSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BoardSession[]) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: BoardSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // storage full or unavailable
  }
}

export function BoardProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<BoardSession[]>(loadSessions);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  const createSession = useCallback(
    (overrides?: Partial<BoardSession>) => {
      const session = createBoardSession(overrides);
      setSessions((prev) => [session, ...prev]);
      return session;
    },
    []
  );

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions]
  );

  const updateSession = useCallback(
    (id: string, updates: Partial<BoardSession>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
        )
      );
    },
    []
  );

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const duplicateSession = useCallback(
    (id: string) => {
      const original = sessions.find((s) => s.id === id);
      if (!original) throw new Error("Session not found");
      const copy = createBoardSession({
        ...original,
        id: generateId(),
        title: `${original.title} (Copy)`,
        status: "draft",
        turns: [],
        outcome: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setSessions((prev) => [copy, ...prev]);
      return copy;
    },
    [sessions]
  );

  const addMember = useCallback(
    (sessionId: string, personaId: string, role: SeatRole = "domain_specialist") => {
      const member = createBoardMember(personaId, role);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                members: [...s.members, member],
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    },
    []
  );

  const removeMember = useCallback((sessionId: string, memberId: string) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              members: s.members.filter((m) => m.id !== memberId),
              updatedAt: new Date().toISOString(),
            }
          : s
      )
    );
  }, []);

  const updateMember = useCallback(
    (sessionId: string, memberId: string, updates: Partial<BoardMember>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                members: s.members.map((m) =>
                  m.id === memberId ? { ...m, ...updates } : m
                ),
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    },
    []
  );

  const setBrief = useCallback(
    (sessionId: string, brief: Partial<BoardBrief>) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                brief: { ...s.brief, ...brief },
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    },
    []
  );

  const setMode = useCallback((sessionId: string, mode: DepthMode) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, mode, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  const setStatus = useCallback((sessionId: string, status: BoardStatus) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? { ...s, status, updatedAt: new Date().toISOString() }
          : s
      )
    );
  }, []);

  const addTurn = useCallback(
    (sessionId: string, turn: Omit<DiscussionTurn, "id" | "createdAt">) => {
      const fullTurn = createDiscussionTurn(turn.memberId, turn.stage, turn.content, {
        references: turn.references,
        stance: turn.stance,
      });
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                turns: [...s.turns, fullTurn],
                updatedAt: new Date().toISOString(),
              }
            : s
        )
      );
    },
    []
  );

  const setOutcome = useCallback(
    (sessionId: string, outcome: DecisionOutcome) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, outcome, updatedAt: new Date().toISOString() }
            : s
        )
      );
    },
    []
  );

  const createSessionFromPersonas = useCallback(
    (personaIds: string[]) => {
      const session = createBoardSession({
        members: personaIds.map((id, i) =>
          createBoardMember(
            id,
            i === 0 ? "chair" : i === 1 ? "domain_specialist" : "operator"
          )
        ),
      });
      setSessions((prev) => [session, ...prev]);
      return session;
    },
    []
  );

  return (
    <BoardContext.Provider
      value={{
        sessions,
        createSession,
        getSession,
        updateSession,
        deleteSession,
        duplicateSession,
        addMember,
        removeMember,
        updateMember,
        setBrief,
        setMode,
        setStatus,
        addTurn,
        setOutcome,
        createSessionFromPersonas,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
}

export function useBoard() {
  const ctx = useContext(BoardContext);
  if (!ctx) throw new Error("useBoard must be used within BoardProvider");
  return ctx;
}
