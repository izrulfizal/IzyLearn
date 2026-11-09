
"use client";

import { useEffect, useMemo, useRef } from "react";

import {
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  Clock3
} from "lucide-react";

export type AgentStatus =
  | "idle"
  | "thinking"
  | "working"
  | "reviewing"
  | "completed"
  | "failed";

export interface AgentActivity {
  jobId: string;
  agent: "Izzy" | "Suria" | "Saujana" | "Arus" | "Embun";
  status: AgentStatus;
  message: string;
  timestamp: string;
}

interface Props {
  activities: AgentActivity[];
}

const agents = [
  { name: "Izzy", emoji: "🧠" },
  { name: "Suria", emoji: "☀️" },
  { name: "Saujana", emoji: "🎨" },
  { name: "Arus", emoji: "💻" },
  { name: "Embun", emoji: "🧪" }
] as const;

const ACTIVE_STATUSES: AgentStatus[] = [
  "thinking",
  "working",
  "reviewing"
];

function isActiveStatus(status: AgentStatus) {
  return ACTIVE_STATUSES.includes(status);
}

function getStatusColor(status: AgentStatus) {
  switch (status) {
    case "completed":
      return "text-emerald-400";

    case "failed":
      return "text-red-400";

    case "thinking":
    case "working":
    case "reviewing":
      return "text-blue-400";

    default:
      return "text-slate-500";
  }
}

export default function AgentActivityFeed({
  activities
}: Props) {
  const feedRef = useRef<HTMLDivElement>(null);

  // Find each agent's latest activity.
  const latestActivities = useMemo(() => {
    const latest = new Map<
      AgentActivity["agent"],
      {
        activity: AgentActivity;
        index: number;
      }
    >();

    activities.forEach((activity, index) => {
      latest.set(activity.agent, {
        activity,
        index
      });
    });

    return latest;
  }, [activities]);

  // Scroll to the newest activity automatically.
  useEffect(() => {
    const container = feedRef.current;

    if (!container) return;

    container.scrollTop = container.scrollHeight;
  }, [activities]);

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">

      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">
            Live Agent Workspace
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Real-time collaboration between your AI agents
          </p>
        </div>

        {activities.some(
          activity =>
            isActiveStatus(
              latestActivities.get(activity.agent)
                ?.activity.status ?? "idle"
            )
        ) && (
          <div className="flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-2 text-xs text-blue-400">
            <LoaderCircle
              size={15}
              className="animate-spin"
            />
            Processing
          </div>
        )}
      </div>

      {/* Agent Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {agents.map(agent => {
          const status: AgentStatus =
            latestActivities.get(agent.name)
              ?.activity.status ?? "idle";

          const active = isActiveStatus(status);

          return (
            <div
              key={agent.name}
              className={`rounded-xl border bg-slate-950 p-4 transition-all duration-300 ${
                active
                  ? "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.08)]"
                  : status === "completed"
                  ? "border-emerald-500/20"
                  : status === "failed"
                  ? "border-red-500/30"
                  : "border-white/10"
              }`}
            >
              <div className="mb-2 text-3xl">
                {agent.emoji}
              </div>

              <p className="font-semibold">
                {agent.name}
              </p>

              <div
                className={`mt-2 flex items-center gap-2 text-xs font-medium ${getStatusColor(status)}`}
              >
                {active ? (
                  <LoaderCircle
                    size={14}
                    className="animate-spin"
                  />
                ) : status === "completed" ? (
                  <CheckCircle2 size={14} />
                ) : status === "failed" ? (
                  <AlertCircle size={14} />
                ) : (
                  <Clock3 size={14} />
                )}

                <span>
                  {status.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Feed Header */}
      <div className="mb-3 mt-7 flex items-center justify-between">
        <h3 className="font-semibold">
          Activity Feed
        </h3>

        <span className="text-xs text-slate-500">
          {activities.length} events
        </span>
      </div>

      {/* Scrollable Activity Feed */}
      <div
        ref={feedRef}
        className="max-h-80 space-y-2 overflow-y-auto scroll-smooth"
        aria-label="Agent activity history"
      >
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">
            Waiting for agent activity...
          </p>
        ) : (
          activities.map((activity, index) => {
            const latest =
              latestActivities.get(activity.agent);

            // Only the latest active event for
            // each agent should keep spinning.
            const isLatestEvent =
              latest?.index === index;

            const isRunning =
              isLatestEvent &&
              isActiveStatus(activity.status);

            const completed =
              activity.status === "completed";

            const failed =
              activity.status === "failed";

            return (
              <div
                key={`${activity.jobId}-${index}`}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                  isRunning
                    ? "border-blue-500/20 bg-blue-500/5"
                    : "border-transparent bg-slate-950"
                }`}
              >
                {/* Activity Status Icon */}
                <div className="mt-0.5 shrink-0">
                  {isRunning ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin text-blue-400"
                    />
                  ) : completed ? (
                    <CheckCircle2
                      size={18}
                      className="text-emerald-400"
                    />
                  ) : failed ? (
                    <AlertCircle
                      size={18}
                      className="text-red-400"
                    />
                  ) : isActiveStatus(activity.status) ? (
                    <CheckCircle2
                      size={18}
                      className="text-slate-500"
                    />
                  ) : (
                    <Clock3
                      size={18}
                      className="text-slate-500"
                    />
                  )}
                </div>

                {/* Activity Details */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed">
                    <strong>
                      {activity.agent}
                    </strong>

                    {" — "}

                    {activity.message}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-slate-500">
                      {new Date(
                        activity.timestamp
                      ).toLocaleTimeString()}
                    </p>

                    {isRunning && (
                      <span className="text-xs text-blue-400">
                        In progress...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
