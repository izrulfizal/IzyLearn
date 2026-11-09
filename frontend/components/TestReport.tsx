
"use client";

import {
  CheckCircle2,
  XCircle,
  ShieldCheck
} from "lucide-react";

import type {
  WebsiteTestReport
} from "@/lib/api";

interface TestReportProps {
  report: WebsiteTestReport;
}

export default function TestReport({
  report
}: TestReportProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-400" />

            <h2 className="text-xl font-bold">
              Embun's QA Report
            </h2>
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Automated browser testing results
          </p>
        </div>

        <div className="text-right">
          <p className={`text-3xl font-bold ${
            report.passed
              ? "text-emerald-400"
              : "text-amber-400"
          }`}>
            {report.score}%
          </p>

          <p className="text-xs text-slate-400">
            Test Score
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {report.tests.map((test, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-xl bg-slate-950 p-4"
          >
            {test.passed ? (
              <CheckCircle2
                size={20}
                className="shrink-0 text-emerald-400"
              />
            ) : (
              <XCircle
                size={20}
                className="shrink-0 text-red-400"
              />
            )}

            <div>
              <p className="text-sm font-semibold">
                {test.name}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {test.details}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-sm text-slate-400">
        {report.summary}
      </p>
    </section>
  );
}
