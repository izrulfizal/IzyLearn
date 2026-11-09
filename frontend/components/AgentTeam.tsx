
"use client";

import {
  useEffect,
  useMemo,
  useState
} from "react";

import { io } from "socket.io-client";

import {
  BrainCircuit,
  BookOpen,
  Palette,
  Code2,
  ShieldCheck,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Activity,
  Clock3
} from "lucide-react";

import {
  API_URL,
  type Agent
} from "@/lib/api";

import type {
  AgentActivity
} from "./AgentActivityFeed";

// ========================================
// Agent configuration
// ========================================

const agentIcons = {
  izzy: BrainCircuit,
  suria: BookOpen,
  saujana: Palette,
  arus: Code2,
  embun: ShieldCheck
};

const agentColors = {
  izzy: "text-violet-400 bg-violet-500/10",
  suria: "text-amber-400 bg-amber-500/10",
  saujana: "text-pink-400 bg-pink-500/10",
  arus: "text-cyan-400 bg-cyan-500/10",
  embun: "text-emerald-400 bg-emerald-500/10"
};

type AgentStatus =
  | "idle"
  | "thinking"
  | "working"
  | "reviewing"
  | "completed"
  | "failed";

interface AgentTeamProps {
  activities?: AgentActivity[];
}

const statusColors: Record<
  AgentStatus,
  string
> = {
  idle: "text-slate-500",
  thinking: "text-blue-400",
  working: "text-violet-400",
  reviewing: "text-amber-400",
  completed: "text-emerald-400",
  failed: "text-red-400"
};

const statusDotColors: Record<
  AgentStatus,
  string
> = {
  idle: "bg-slate-600",
  thinking: "bg-blue-400",
  working: "bg-violet-400",
  reviewing: "bg-amber-400",
  completed: "bg-emerald-400",
  failed: "bg-red-400"
};

const activeStatuses: AgentStatus[] = [
  "thinking",
  "working",
  "reviewing"
];

const fallbackAgents = [
  {
    id: "izzy",
    name: "Izzy",
    role: "Coordinator"
  },
  {
    id: "suria",
    name: "Suria",
    role: "Content Analyst"
  },
  {
    id: "saujana",
    name: "Saujana",
    role: "Learning Designer"
  },
  {
    id: "arus",
    name: "Arus",
    role: "Developer"
  },
  {
    id: "embun",
    name: "Embun",
    role: "Quality Assurance"
  }
];

export default function AgentTeam({
  activities = []
}: AgentTeamProps) {
  const [agents, setAgents] =
    useState<Agent[]>([]);

  const [connected, setConnected] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  // ========================================
  // Socket.IO connection
  // ========================================

  useEffect(() => {
    const socket = io(API_URL);

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on(
      "agents:snapshot",
      (data: Agent[]) => {
        setAgents(data);
      }
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  // ========================================
  // Latest activity per agent
  // ========================================

  const latestActivities = useMemo(() => {
    const latest = new Map<
      string,
      AgentActivity
    >();

    for (const activity of activities) {
      latest.set(
        activity.agent.toLowerCase(),
        activity
      );
    }

    return latest;
  }, [activities]);

  // ========================================
  // Agent list
  // ========================================

  const displayedAgents =
    agents.length > 0
      ? agents
      : fallbackAgents;

  // ========================================
  // Active agent count
  // ========================================

  const activeCount = displayedAgents.filter(
    agent => {
      const latest = latestActivities.get(
        agent.name.toLowerCase()
      );

      const status =
        (latest?.status ??
          ("status" in agent ? agent.status : "idle") ??
          "idle") as AgentStatus;

      return activeStatuses.includes(status);
    }
  ).length;

  return (
    <div className="space-y-4">

      {/* =====================================
          Connection Status
      ===================================== */}

      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3">

        <div className="flex items-center gap-2">

          <span
            className={`h-2 w-2 rounded-full ${
              connected
                ? "bg-emerald-400"
                : "bg-red-400"
            }`}
          />

          <span className="text-xs text-slate-400">
            {connected
              ? "Agents connected"
              : "Connecting to agents"}
          </span>

        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          {connected ? (
            <Wifi size={14} />
          ) : (
            <WifiOff size={14} />
          )}

          <span>
            {activeCount} active
          </span>
        </div>

      </div>

      {/* =====================================
          Agent Rows
      ===================================== */}

      <div className="space-y-1">

        {displayedAgents.map(agent => {
          const id =
            agent.id as keyof typeof agentIcons;

          const Icon =
            agentIcons[id] || BrainCircuit;

          const color =
            agentColors[id] ||
            agentColors.izzy;

          const latest = latestActivities.get(
            agent.name.toLowerCase()
          );

          const status =
            (latest?.status ??
              ("status" in agent ? agent.status : "idle") ??
              "idle") as AgentStatus;

          const isActive =
            activeStatuses.includes(status);

          return (
            <div
              key={agent.id}
              className={`rounded-lg border p-3 transition ${
                isActive
                  ? "border-violet-500/30 bg-violet-500/[0.04]"
                  : "border-transparent hover:bg-white/[0.03]"
              }`}
            >

              <div className="flex items-center gap-3">

                {/* Agent Icon */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}
                >
                  <Icon size={18} />
                </div>

                {/* Agent Details */}
                <div className="min-w-0 flex-1">

                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">
                      {agent.name}
                    </h3>

                    {isActive && (
                      <span
                        className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400"
                        aria-label="Active"
                      />
                    )}
                  </div>

                  <p className="truncate text-[11px] text-slate-500">
                    {agent.role}
                  </p>

                </div>

                {/* Status */}
                <div className="flex shrink-0 items-center gap-1.5">

                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      statusDotColors[status] ??
                      statusDotColors.idle
                    }`}
                  />

                  <span
                    className={`text-[11px] capitalize ${
                      statusColors[status] ??
                      statusColors.idle
                    }`}
                  >
                    {status}
                  </span>

                </div>

              </div>

              {/* Latest activity message */}
              {latest?.message && (
                <p className="mt-2 line-clamp-2 pl-12 text-xs leading-relaxed text-slate-400">
                  {latest.message}
                </p>
              )}

            </div>
          );
        })}

      </div>

      {/* =====================================
          Activity Summary
      ===================================== */}

      <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-3">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-2">
            <Activity
              size={15}
              className="text-slate-400"
            />

            <span className="text-xs font-medium">
              Agent activity
            </span>
          </div>

          <span className="text-[11px] text-slate-500">
            {activities.length} events
          </span>

        </div>

        {/* Most recent activity */}
        {activities.length > 0 ? (
          <div className="mt-3">

            <p className="text-xs leading-relaxed text-slate-400">
              <span className="font-medium text-slate-200">
                {activities[activities.length - 1].agent}
              </span>
              {" — "}
              {activities[activities.length - 1].message}
            </p>

          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">
            No activity yet. Generate a lesson to
            see the agents working.
          </p>
        )}

        {/* Activity history toggle */}
        {activities.length > 1 && (
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            aria-expanded={showHistory}
            className="mt-3 flex w-full items-center justify-between border-t border-white/[0.07] pt-3 text-xs text-slate-400 transition hover:text-white"
          >
            <span>
              {showHistory
                ? "Hide activity history"
                : "View activity history"}
            </span>

            {showHistory ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </button>
        )}

        {/* Expanded history */}
        {showHistory && activities.length > 1 && (
          <div className="mt-3 max-h-64 space-y-3 overflow-y-auto border-t border-white/[0.07] pt-3">

            {[...activities]
              .reverse()
              .map((activity, index) => (
                <div
                  key={`${activity.jobId}-${index}`}
                  className="flex gap-2"
                >

                  <Clock3
                    size={13}
                    className="mt-0.5 shrink-0 text-slate-600"
                  />

                  <div className="min-w-0">

                    <p className="text-[11px] font-medium text-slate-300">
                      {activity.agent}
                    </p>

                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {activity.message}
                    </p>

                  </div>

                </div>
              ))}

          </div>
        )}

      </div>

    </div>
  );
}
