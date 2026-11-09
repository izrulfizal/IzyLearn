
"use client";

import { useState } from "react";

import {
  BookOpen,
  GraduationCap,
  PanelRightClose,
  PanelRightOpen,
  Workflow,
  Layers3,
  ChevronDown,
  ChevronUp
} from "lucide-react";

import AgentTeam from "@/components/AgentTeam";
import LessonCreator from "@/components/LessonCreator";

import type {
  AgentActivity
} from "@/components/AgentActivityFeed";

export default function Home() {
  const [activities, setActivities] =
    useState<AgentActivity[]>([]);

  const [showAgents, setShowAgents] =
    useState(true);

  const [mobileAgentsOpen, setMobileAgentsOpen] =
    useState(false);

  return (
    <main className="min-h-screen bg-[#0c0d10] text-slate-100">

      {/* =====================================
          Application Header
      ===================================== */}

      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#0c0d10]/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

          {/* Branding */}
          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-600">
              <BookOpen size={19} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight">
                izy<span className="text-violet-400">Learn</span>
              </h1>

              <p className="hidden text-[11px] text-slate-500 sm:block">
                Interactive Learning Studio
              </p>
            </div>

            <span className="ml-2 hidden rounded-md border border-white/10 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 md:inline-flex">
              MVP
            </span>

          </div>

          {/* Header actions */}
          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <Layers3 size={15} />
              AI Learning Workspace
            </div>

            <div className="hidden h-5 w-px bg-white/10 sm:block" />

            <button
              type="button"
              onClick={() => setShowAgents(!showAgents)}
              className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/[0.07] lg:flex"
              aria-label={
                showAgents
                  ? "Hide agent panel"
                  : "Show agent panel"
              }
              aria-expanded={showAgents}
              aria-controls="desktop-agent-panel"
            >
              {showAgents ? (
                <PanelRightClose size={16} />
              ) : (
                <PanelRightOpen size={16} />
              )}

              {showAgents ? "Hide agents" : "Show agents"}
            </button>

          </div>

        </div>

      </header>

      {/* =====================================
          Main Workspace
      ===================================== */}

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Workspace heading */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">

          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-violet-400">
              <GraduationCap size={15} />
              Learning Studio
            </div>

            <h2 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
              Create a learning experience
            </h2>

            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Transform your teaching materials into
              interactive lessons, quizzes, and learning websites.
            </p>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-[#14161b] px-3 py-2 text-xs text-slate-400 md:flex">
            <Workflow size={15} className="text-violet-400" />
            Five specialized AI agents
          </div>

        </div>

        {/* =====================================
            Desktop Workspace Grid
        ===================================== */}

        <div
          className={`grid items-start gap-5 ${
            showAgents
              ? "lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]"
              : "grid-cols-1"
          }`}
        >

          {/* Lesson Creator */}
          <section className="min-w-0">

            <div className="mb-3 flex items-center gap-2 px-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10 text-violet-400">
                <BookOpen size={14} />
              </span>

              <h3 className="text-sm font-semibold">
                Lesson Workspace
              </h3>
            </div>

            <LessonCreator
              onActivitiesChange={setActivities}
            />

          </section>

          {/* =====================================
              Desktop Agent Panel
          ===================================== */}

          {showAgents && (
            <aside
              id="desktop-agent-panel"
              className="hidden min-w-0 lg:block"
            >

              <div className="mb-3 flex items-center justify-between px-1">

                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.05] text-slate-400">
                    <Workflow size={14} />
                  </span>

                  <h3 className="text-sm font-semibold">
                    AI Agent Team
                  </h3>
                </div>

                <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] text-slate-500">
                  5 agents
                </span>

              </div>

              <div className="lg:sticky lg:top-20">
                <div className="max-h-[calc(100vh-7rem)] overflow-y-auto overscroll-contain rounded-xl border border-white/[0.07] bg-[#111318] p-3">
                  <AgentTeam
                    activities={activities}
                  />
                </div>
              </div>

            </aside>
          )}

        </div>

        {/* =====================================
            Mobile / Tablet Agent Panel
        ===================================== */}

        <section className="mt-5 lg:hidden">

          <button
            type="button"
            onClick={() =>
              setMobileAgentsOpen(!mobileAgentsOpen)
            }
            aria-expanded={mobileAgentsOpen}
            aria-controls="mobile-agent-panel"
            className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-[#14161b] px-4 py-3 text-left"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <Workflow size={17} className="text-violet-400" />
              AI Agent Team
            </span>

            {mobileAgentsOpen ? (
              <ChevronUp size={17} className="text-slate-400" />
            ) : (
              <ChevronDown size={17} className="text-slate-400" />
            )}
          </button>

          {mobileAgentsOpen && (
            <div
              id="mobile-agent-panel"
              className="mt-3 rounded-xl border border-white/[0.07] bg-[#111318] p-3"
            >
              <AgentTeam
                activities={activities}
              />
            </div>
          )}

        </section>

        {/* =====================================
            Footer
        ===================================== */}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-5 text-xs text-slate-500">

          <div className="flex items-center gap-2">
            <GraduationCap size={15} />
            <span>
              izyLearn — Learn differently.
            </span>
          </div>

          <span>
            Interactive Learning Studio
          </span>

        </footer>

      </div>

    </main>
  );
}
