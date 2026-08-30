import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { CaseRecord } from "@/lib/grounds-data";
import {
  completePackRun,
  computeMetrics,
  createClaimPack,
  accuracyRows,
  emptyWorkspace,
  importContestSample,
  loadWorkspace,
  resolveGate,
  saveWorkspace,
  trajectoryFor,
  type WorkspaceGate,
  type WorkspaceMetrics,
  type WorkspaceRun,
  type WorkspaceState,
} from "@/lib/workspace-store";

type WorkspaceContextValue = {
  ready: boolean;
  userId: string | null;
  email: string | null;
  workspace: WorkspaceState;
  cases: CaseRecord[];
  runs: WorkspaceRun[];
  gateQueue: WorkspaceGate[];
  metrics: WorkspaceMetrics;
  accuracyByCase: Array<{ name: string; baseline: number; grounds: number }>;
  trajectory: ReturnType<typeof trajectoryFor>;
  refresh: () => void;
  newClaimPack: (input: {
    title: string;
    repo: string;
    source: CaseRecord["source"];
    claimTexts: string[];
  }) => CaseRecord | null;
  runPack: (packId: string, mode: "agent" | "baseline") => void;
  decideGate: (gateId: string, decision: "approved" | "denied") => void;
  importSample: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceState>(() =>
    emptyWorkspace("anon"),
  );

  const hydrate = useCallback(async () => {
    if (import.meta.env.DEV && import.meta.env.VITE_GROUNDS_DEMO === "1") {
      setUserId("demo-user");
      setEmail("demo@grounds.local");
      setWorkspace(loadWorkspace("demo-user", "demo@grounds.local"));
      setReady(true);
      return;
    }
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      setUserId(null);
      setEmail(null);
      setWorkspace(emptyWorkspace("anon"));
      setReady(true);
      return;
    }
    setUserId(user.id);
    setEmail(user.email ?? null);
    setWorkspace(loadWorkspace(user.id, user.email ?? undefined));
    setReady(true);
  }, []);

  useEffect(() => {
    void hydrate();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void hydrate();
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const persist = useCallback((next: WorkspaceState) => {
    setWorkspace(saveWorkspace(next));
  }, []);

  const newClaimPack = useCallback(
    (input: {
      title: string;
      repo: string;
      source: CaseRecord["source"];
      claimTexts: string[];
    }) => {
      if (!userId) return null;
      const next = createClaimPack(workspace, input);
      setWorkspace(next);
      return next.packs[0] ?? null;
    },
    [userId, workspace],
  );

  const runPack = useCallback(
    (packId: string, mode: "agent" | "baseline") => {
      if (!userId) return;
      setWorkspace(completePackRun(workspace, packId, mode));
    },
    [userId, workspace],
  );

  const decideGate = useCallback(
    (gateId: string, decision: "approved" | "denied") => {
      if (!userId) return;
      setWorkspace(resolveGate(workspace, gateId, decision));
    },
    [userId, workspace],
  );

  const importSample = useCallback(() => {
    if (!userId) return;
    setWorkspace(importContestSample(workspace));
  }, [userId, workspace]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      userId,
      email,
      workspace,
      cases: workspace.packs,
      runs: workspace.runs,
      gateQueue: workspace.gate,
      metrics: computeMetrics(workspace),
      accuracyByCase: accuracyRows(workspace),
      trajectory: trajectoryFor(workspace),
      refresh: () => void hydrate(),
      newClaimPack,
      runPack,
      decideGate,
      importSample,
    }),
    [
      ready,
      userId,
      email,
      workspace,
      hydrate,
      newClaimPack,
      runPack,
      decideGate,
      importSample,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}
