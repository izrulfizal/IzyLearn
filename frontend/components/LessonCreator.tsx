
"use client";

import { useEffect, useRef, useState } from "react";
import {
  UploadCloud,
  Sparkles,
  WandSparkles,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Monitor,
  ClipboardList,
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { io, type Socket } from "socket.io-client";

import {
  API_URL,
  uploadMaterials,
  generateLearningExperience,
  type GenerationMode,
  type GenerationResult
} from "@/lib/api";

import WebsitePreview from "./WebsitePreview";
import TestReport from "./TestReport";

import type {
  AgentActivity
} from "./AgentActivityFeed";

type UploadResult = Awaited<
  ReturnType<typeof uploadMaterials>
>;

interface LessonCreatorProps {
  onActivitiesChange?: (
    activities: AgentActivity[]
  ) => void;
}

type ResultTab = "preview" | "planning" | "qa";

async function joinGenerationRoom(
  socket: Socket,
  jobId: string
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(connectionTimeout);
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleError);
    };

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();

      if (error) reject(error);
      else resolve();
    };

    const handleError = (error: Error) => {
      finish(error);
    };

    const handleConnect = () => {
      socket.timeout(8000).emit(
        "generation:join",
        jobId,
        (
          error: Error | null,
          response?: { success: boolean }
        ) => {
          if (error) {
            finish(error);
            return;
          }

          if (!response?.success) {
            finish(
              new Error("Failed to join generation room.")
            );
            return;
          }

          finish();
        }
      );
    };

    const connectionTimeout = setTimeout(() => {
      finish(
        new Error("Socket.IO connection timed out.")
      );
    }, 15000);

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleError);

    if (socket.connected) {
      handleConnect();
    }
  });
}

export default function LessonCreator({
  onActivitiesChange
}: LessonCreatorProps) {
  const [mode, setMode] =
    useState<GenerationMode>("auto");

  const [files, setFiles] = useState<File[]>([]);
  const [instructions, setInstructions] = useState("");
  const [generation, setGeneration] =
    useState<GenerationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<UploadResult | null>(null);
  const [error, setError] = useState("");

  const [resultTab, setResultTab] =
    useState<ResultTab>("preview");

  const [showSetup, setShowSetup] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  const activeSocketRef = useRef<Socket | null>(null);
  const activitiesRef = useRef<AgentActivity[]>([]);
  const onActivitiesChangeRef = useRef(onActivitiesChange);

  useEffect(() => {
    onActivitiesChangeRef.current = onActivitiesChange;
  }, [onActivitiesChange]);

  useEffect(() => {
    return () => {
      activeSocketRef.current?.disconnect();
      activeSocketRef.current = null;
    };
  }, []);

  const updateActivities = (next: AgentActivity[]) => {
    activitiesRef.current = next;
    onActivitiesChangeRef.current?.(next);
  };

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selected = Array.from(
      event.target.files || []
    );

    // Reset input so selecting the same file works.
    event.target.value = "";

    if (selected.length > 5) {
      setError("Maximum 5 files allowed.");
      return;
    }

    if (
      selected.some(
        file => file.size > 20 * 1024 * 1024
      )
    ) {
      setError("Each file must be smaller than 20 MB.");
      return;
    }

    setFiles(selected);
    setError("");
    setResult(null);
  }

  function removeFile(index: number) {
    setFiles(previous =>
      previous.filter((_, i) => i !== index)
    );
    setResult(null);
  }

  async function handleGenerate() {
    if (loading) return;

    if (files.length === 0) {
      setError("Please upload your teaching materials.");
      return;
    }

    if (mode === "custom" && !instructions.trim()) {
      setError("Please enter your custom instructions.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setGeneration(null);
    setShowSetup(true);
    setResultTab("preview");
    setShowDetails(false);
    updateActivities([]);

    const jobId = crypto.randomUUID();

    const socket = io(API_URL, {
      transports: ["polling", "websocket"],
      reconnection: true,
      timeout: 15000
    });

    activeSocketRef.current = socket;

    socket.on(
      "agent:activity",
      (activity: AgentActivity) => {
        if (activity.jobId !== jobId) return;

        updateActivities([
          ...activitiesRef.current,
          activity
        ]);
      }
    );

    try {
      await joinGenerationRoom(socket, jobId);

      const upload = await uploadMaterials(
        files,
        mode,
        instructions
      );

      setResult(upload);

      const generated =
        await generateLearningExperience(
          upload.files.map(file => file.id),
          mode,
          instructions,
          jobId
        );

      setGeneration(generated);
      setShowSetup(false);
      setResultTab("preview");

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );

    } finally {
      setLoading(false);
      socket.removeAllListeners("agent:activity");
      socket.disconnect();

      if (activeSocketRef.current === socket) {
        activeSocketRef.current = null;
      }
    }
  }

  const panelClass =
    "rounded-xl border border-white/[0.08] bg-[#14161b]";

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-[#0c0d10] px-3 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-violet-500 disabled:opacity-50";

  return (
    <div className="space-y-4">

      {/* =====================================
          Creation Panel
      ===================================== */}

      <section className={panelClass}>

        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">

          <div className="flex min-w-0 items-center gap-2">
            <UploadCloud
              size={17}
              className="shrink-0 text-slate-400"
            />
            <h3 className="text-sm font-semibold">
              Lesson setup
            </h3>

            {generation && (
              <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-400">
                Generated
              </span>
            )}
          </div>

          {generation && (
            <button
              type="button"
              onClick={() => setShowSetup(!showSetup)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
              aria-expanded={showSetup}
            >
              {showSetup ? "Collapse" : "Edit setup"}
              {showSetup ? (
                <ChevronUp size={15} />
              ) : (
                <ChevronDown size={15} />
              )}
            </button>
          )}
        </div>

        {showSetup && (
          <div className="space-y-5 p-4 sm:p-5">

            {/* Upload */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-xs font-medium text-slate-300">
                  Teaching materials
                </label>
                <span className="text-[11px] text-slate-500">
                  Up to 5 files · 20 MB each
                </span>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/15 bg-[#0c0d10] px-4 py-4 transition hover:border-violet-500/50 hover:bg-white/[0.02]">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                  <UploadCloud
                    size={20}
                    className="text-slate-400"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    Choose files to upload
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    PDF, PPTX, JPG or PNG
                  </p>
                </div>

                <span className="hidden rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300 sm:inline-flex">
                  Browse
                </span>

                <input
                  type="file"
                  multiple
                  accept=".pdf,.pptx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  disabled={loading}
                  className="sr-only"
                />
              </label>

              {files.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#0c0d10] px-3 py-2"
                    >
                      <FileText
                        size={16}
                        className="shrink-0 text-slate-400"
                      />

                      <span className="min-w-0 flex-1 truncate text-xs text-slate-300">
                        {file.name}
                      </span>

                      <span className="shrink-0 text-[11px] text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        disabled={loading}
                        aria-label={`Remove ${file.name}`}
                        className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white disabled:opacity-50"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generation mode */}
            <div>
              <p className="mb-2 text-xs font-medium text-slate-300">
                Generation mode
              </p>

              <div className="grid grid-cols-2 gap-2">

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode("auto");
                    setResult(null);
                  }}
                  aria-pressed={mode === "auto"}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm transition disabled:opacity-50 ${
                    mode === "auto"
                      ? "border-violet-500/60 bg-violet-500/10 text-white"
                      : "border-white/10 bg-[#0c0d10] text-slate-400 hover:border-white/20"
                  }`}
                >
                  <Sparkles
                    size={17}
                    className="shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium sm:text-sm">
                      Auto-create
                    </span>
                    <span className="hidden text-[11px] text-slate-500 sm:block">
                      AI chooses activities
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setMode("custom");
                    setResult(null);
                  }}
                  aria-pressed={mode === "custom"}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-sm transition disabled:opacity-50 ${
                    mode === "custom"
                      ? "border-violet-500/60 bg-violet-500/10 text-white"
                      : "border-white/10 bg-[#0c0d10] text-slate-400 hover:border-white/20"
                  }`}
                >
                  <WandSparkles
                    size={17}
                    className="shrink-0"
                  />
                  <span className="min-w-0">
                    <span className="block text-xs font-medium sm:text-sm">
                      Custom
                    </span>
                    <span className="hidden text-[11px] text-slate-500 sm:block">
                      Guide the generation
                    </span>
                  </span>
                </button>
              </div>
            </div>

            {mode === "custom" && (
              <div>
                <label
                  htmlFor="lesson-instructions"
                  className="mb-2 block text-xs font-medium text-slate-300"
                >
                  Custom instructions
                </label>

                <textarea
                  id="lesson-instructions"
                  value={instructions}
                  onChange={event =>
                    setInstructions(event.target.value)
                  }
                  disabled={loading}
                  maxLength={2000}
                  rows={3}
                  placeholder="Example: Create an interactive cybersecurity challenge with puzzles and a final quiz."
                  className={`${inputClass} resize-y`}
                />
              </div>
            )}

            {/* Generate */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || files.length === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Generating learning experience...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Generate learning experience
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {loading && (
              <p
                role="status"
                className="text-center text-xs text-slate-400"
              >
                Your AI team is working. Follow its progress
                in the Agent Team panel.
              </p>
            )}

          </div>
        )}
      </section>

      {/* =====================================
          Error
      ===================================== */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
        >
          <AlertCircle size={17} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* =====================================
          Upload confirmation
      ===================================== */}

      {result && !generation && (
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#14161b] px-4 py-3 text-xs text-slate-300">
          <CheckCircle2
            size={16}
            className="text-emerald-400"
          />
          {result.files.length} file(s) uploaded.
          {loading && " Building your lesson..."}
        </div>
      )}

      {/* =====================================
          Generated Results
      ===================================== */}

      {generation && (
        <section className={panelClass}>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2
                size={17}
                className="text-emerald-400"
              />
              <h3 className="text-sm font-semibold">
                Generated experience
              </h3>
            </div>

            <span
              className={`rounded-md px-2 py-1 text-[11px] ${
                generation.qualityStatus === "passed"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}
            >
              {generation.qualityStatus === "passed"
                ? "QA passed"
                : "Needs review"}
            </span>
          </div>

          {/* Result tabs */}
          <div
            role="tablist"
            aria-label="Generated lesson sections"
            className="flex gap-1 overflow-x-auto border-b border-white/[0.07] px-3 pt-2"
          >
            {([
              ["preview", "Preview", Monitor],
              ["planning", "Planning", ClipboardList],
              ["qa", "Quality", ShieldCheck]
            ] as const).map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={resultTab === tab}
                onClick={() => setResultTab(tab)}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-medium transition ${
                  resultTab === tab
                    ? "border-violet-400 text-white"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <div className="min-w-0 p-3 sm:p-4">

            {/* Preview tab: keep mounted to preserve
                publication state when switching tabs. */}
            {generation.website && (
              <div
                className={
                  resultTab === "preview" ? "block" : "hidden"
                }
              >
                <WebsitePreview
                  title={generation.website.title}
                  html={generation.website.html}
                  websiteId={generation.website.id}
                />
              </div>
            )}

            {resultTab === "preview" && !generation.website && (
              <p className="py-8 text-center text-sm text-slate-400">
                No website preview is available.
              </p>
            )}

            {/* Planning tab */}
            {resultTab === "planning" && (
              <div className="space-y-4">

                <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Suria · Lesson analysis
                  </p>

                  <h4 className="text-sm font-semibold">
                    {generation.analysis.title}
                  </h4>

                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {generation.analysis.summary}
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowDetails(!showDetails)}
                    aria-expanded={showDetails}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-violet-400"
                  >
                    Learning objectives
                    {showDetails ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>

                  {showDetails && (
                    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-300">
                      {generation.analysis.learningObjectives.map(
                        (objective, index) => (
                          <li key={index}>{objective}</li>
                        )
                      )}
                    </ul>
                  )}
                </div>

                <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Saujana · Experience blueprint
                  </p>

                  <h4 className="text-sm font-semibold">
                    {generation.blueprint.title}
                  </h4>

                  <p className="mt-1 text-sm text-slate-400">
                    {generation.blueprint.tagline}
                  </p>

                  <div className="mt-4 space-y-2">
                    {generation.blueprint.activities.map(
                      activity => (
                        <div
                          key={activity.id}
                          className="rounded-lg border border-white/[0.07] bg-[#14161b] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">
                              {activity.title}
                            </p>
                            <span className="text-[11px] text-violet-400">
                              {activity.type}
                            </span>
                          </div>

                          <p className="mt-1 text-xs leading-relaxed text-slate-400">
                            {activity.instructions}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* QA tab */}
            {resultTab === "qa" && (
              <div className="space-y-4">

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4">
                    <p className="text-xs text-slate-400">
                      Repair attempts
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {generation.repairAttempts}
                    </p>
                  </div>

                  <div className="rounded-lg border border-white/[0.07] bg-[#0c0d10] p-4">
                    <p className="text-xs text-slate-400">
                      Quality status
                    </p>
                    <p
                      className={`mt-2 text-sm font-semibold ${
                        generation.qualityStatus === "passed"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {generation.qualityStatus === "passed"
                        ? "Passed"
                        : "Needs review"}
                    </p>
                  </div>
                </div>

                {generation.testReport ? (
                  <TestReport
                    report={generation.testReport}
                  />
                ) : (
                  <p className="text-sm text-slate-400">
                    No QA report is available.
                  </p>
                )}

              </div>
            )}

          </div>
        </section>
      )}
    </div>
  );
}
