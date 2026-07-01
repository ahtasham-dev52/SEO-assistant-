import React, { useState, useEffect } from "react";
import { Clock, Plus, Trash2, FileText, Sparkles, AlertCircle, Copy, Check, Terminal, Code, HelpCircle } from "lucide-react";
import { TimeLog } from "../types";

interface WorkAssistantProps {
  onAddDraft: (title: string, content: string, type: string) => void;
}

export default function WorkAssistant({ onAddDraft }: WorkAssistantProps) {
  const [activeTab, setActiveTab] = useState<"time-logs" | "bug-explainer">("time-logs");

  // Time log states
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [project, setProject] = useState("");
  const [taskName, setTaskName] = useState("");
  const [hours, setHours] = useState("");
  const [details, setDetails] = useState("");
  const [progressResult, setProgressResult] = useState("");
  const [progressLoading, setProgressLoading] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Bug explainer states
  const [code, setCode] = useState("");
  const [errorText, setErrorText] = useState("");
  const [targetAudience, setTargetAudience] = useState("Client / PM (Simple English)");
  const [bugResult, setBugResult] = useState("");
  const [bugLoading, setBugLoading] = useState(false);
  const [copiedBug, setCopiedBug] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("assistant_time_logs");
    if (saved) {
      setTimeLogs(JSON.parse(saved));
    } else {
      // Preload initial logs
      const initial: TimeLog[] = [
        {
          id: "log-1",
          project: "AFC Industries",
          task: "SEO Speed Audit",
          hours: 4,
          date: new Date().toISOString().split("T")[0],
          details: "Benchmarked loading times on afcind.com. Flagged SKU search query bottlenecks and raw high-res component image sizes."
        },
        {
          id: "log-2",
          project: "AFC Industries",
          task: "Staging Setup & Tests",
          hours: 6,
          date: new Date().toISOString().split("T")[0],
          details: "Configured clean staging copy. Injected compressed image specifications and drafted core responsive layout changes."
        },
        {
          id: "log-3",
          project: "HubSpot CRM Sync",
          task: "Laravel Sync Engine",
          hours: 5,
          date: new Date().toISOString().split("T")[0],
          details: "Fixed a Webhook payload mapping bug. Tested live deal sync flows from React form submissions."
        }
      ];
      setTimeLogs(initial);
      localStorage.setItem("assistant_time_logs", JSON.stringify(initial));
    }
  }, []);

  const saveLogs = (updated: TimeLog[]) => {
    setTimeLogs(updated);
    localStorage.setItem("assistant_time_logs", JSON.stringify(updated));
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!project.trim() || !taskName.trim() || !hours) return;

    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      project: project.trim(),
      task: taskName.trim(),
      hours: parseFloat(hours),
      date: new Date().toISOString().split("T")[0],
      details: details.trim()
    };

    const updated = [newLog, ...timeLogs];
    saveLogs(updated);

    // Reset inputs
    setProject("");
    setTaskName("");
    setHours("");
    setDetails("");
  };

  const handleDeleteLog = (id: string) => {
    const updated = timeLogs.filter(l => l.id !== id);
    saveLogs(updated);
  };

  const handleGenerateProgressReport = async () => {
    if (timeLogs.length === 0) return;

    setProgressLoading(true);
    setProgressResult("");

    const logSummary = timeLogs
      .map(
        (l) =>
          `- [${l.project}] ${l.task} (${l.hours} hrs): ${l.details}`
      )
      .join("\n");

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "progress-report",
          payload: {
            progressPoints: logSummary,
            extraContext: "Keep the summary professional, clear, and high-impact. Structure into Completed, In Progress, and Next Steps."
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile progress report");
      }

      const data = await response.json();
      setProgressResult(data.result);
    } catch (error: any) {
      console.error(error);
      setProgressResult(`❌ Error compiling report: ${error.message || "Request failed."}`);
    } finally {
      setProgressLoading(false);
    }
  };

  const handleExplainBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setBugLoading(true);
    setBugResult("");

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bug-explainer",
          payload: {
            code,
            error: errorText,
            targetAudience
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Explanation request failed");
      }

      const data = await response.json();
      setBugResult(data.result);
    } catch (error: any) {
      console.error(error);
      setBugResult(`❌ Error explaining bug: ${error.message || "Request failed."}`);
    } finally {
      setBugLoading(false);
    }
  };

  const handleCopyProgressReport = () => {
    navigator.clipboard.writeText(progressResult);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const handleCopyBugExplanation = () => {
    navigator.clipboard.writeText(bugResult);
    setCopiedBug(true);
    setTimeout(() => setCopiedBug(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-100 pb-px gap-6">
        <button
          onClick={() => setActiveTab("time-logs")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 px-1 cursor-pointer ${
            activeTab === "time-logs"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Time Log & Progress Compiler
        </button>
        <button
          onClick={() => setActiveTab("bug-explainer")}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 px-1 cursor-pointer ${
            activeTab === "bug-explainer"
              ? "border-teal-500 text-teal-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          Technical Bug Explainer
        </button>
      </div>

      {activeTab === "time-logs" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Time Logger Form */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3.5 flex items-center gap-1.5">
                <Clock size={16} className="text-teal-500" />
                Add Daily Deliverable Log
              </h3>
              
              <form onSubmit={handleAddLog} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Project / Site</label>
                  <input
                    type="text"
                    required
                    value={project}
                    onChange={(e) => setProject(e.target.value)}
                    placeholder="e.g. AFC Industries"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Task Deliverable</label>
                  <input
                    type="text"
                    required
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    placeholder="e.g. SKU search performance optimization"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Hours Expended</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Deliverable details / description</label>
                  <textarea
                    rows={2}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Describe exactly what was completed or troubleshot..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Log Work Point
                </button>
              </form>
            </div>

            {/* Log History list */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm max-h-[220px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
                <span>Active Log Feed ({timeLogs.length})</span>
                {timeLogs.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Clear all logs?")) {
                        saveLogs([]);
                      }
                    }}
                    className="text-[10px] text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </h3>

              {timeLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No time logs compiled for this week.</p>
              ) : (
                <div className="space-y-2">
                  {timeLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors flex items-start justify-between gap-1.5 group">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-800 bg-white px-1.5 py-0.5 rounded border border-slate-200">{log.project}</span>
                          <span className="text-[10px] text-slate-500 font-medium">{log.hours} hrs</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-semibold mt-1 truncate">{log.task}</p>
                        {log.details && (
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{log.details}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Aggregator Compiler */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full min-h-[400px]">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Summary Status Compiler</h3>
                    <p className="text-xs text-slate-400">Aggregate your logged points into a comprehensive progress report</p>
                  </div>
                  <button
                    onClick={handleGenerateProgressReport}
                    disabled={timeLogs.length === 0 || progressLoading}
                    className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles size={13} className="text-teal-400" />
                    {progressLoading ? "Compiling..." : "Compile Progress Report"}
                  </button>
                </div>

                {progressResult ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Generated Staged Report</span>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyProgressReport}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 cursor-pointer"
                        >
                          {copiedReport ? (
                            <>
                              <Check size={12} className="text-green-500" />
                              <span className="text-green-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              <span>Copy Progress</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => onAddDraft("Compiled Progress Update", progressResult, "Progress Update")}
                          className="flex items-center gap-1 text-[11px] font-semibold text-white bg-slate-900 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 cursor-pointer"
                        >
                          Save Draft
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 font-sans text-xs leading-relaxed text-slate-700 whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                      {progressResult}
                    </div>
                  </div>
                ) : (
                  <div className="h-60 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 bg-slate-50/30">
                    <div className="p-3 bg-white rounded-full border border-slate-100 shadow-xs mb-3 text-slate-400">
                      <FileText size={22} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Ready to Compile Progress</h4>
                    <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                      {timeLogs.length > 0 
                        ? `You have ${timeLogs.length} active deliverable logs in the queue. Click "Compile Progress Report" to generate an executive email draft using Gemini.` 
                        : "Log your deliverables on the left panel to begin compiling your weekly summary report."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bug Explainer workspace */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 space-y-4">
            <form onSubmit={handleExplainBug} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Code size={16} className="text-teal-500" />
                Explain Bug / Code Issue
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Code Snippet</label>
                <textarea
                  required
                  rows={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. const [state, setState] = useState([]);
useEffect(() => {
  fetchData().then(data => setState(data));
}, [state]);"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-mono text-[11px] bg-slate-900 text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Console Error Trace (Optional)</label>
                <input
                  type="text"
                  value={errorText}
                  onChange={(e) => setErrorText(e.target.value)}
                  placeholder="e.g. Maximum update depth exceeded..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Target Explanation Style</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                >
                  <option value="Client / PM (Simple English)">Client / PM (Simple English, No Jargon)</option>
                  <option value="Senior Developer (Technical details)">Senior Developer (Technical breakdown)</option>
                  <option value="Roman Urdu/Hindi (Casual explanation)">Casual Roman Urdu/Hindi (Roman Script)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={bugLoading || !code.trim()}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Sparkles size={13} className="text-teal-400" />
                {bugLoading ? "Analyzing logic..." : "Explain Bug & Correct Code"}
              </button>
            </form>
          </div>

          {/* Explanation Output */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[400px] flex flex-col justify-between h-full">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Analysis Breakdown</h3>
                    <p className="text-xs text-slate-400">Gemini-powered debugging diagnostics & solution layout</p>
                  </div>
                </div>

                {bugResult ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Staged Explanation</span>
                      <button
                        onClick={handleCopyBugExplanation}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 cursor-pointer"
                      >
                        {copiedBug ? (
                          <>
                            <Check size={12} className="text-green-500" />
                            <span className="text-green-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>Copy Explanation</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 font-sans text-xs leading-relaxed text-slate-700 whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                      {bugResult}
                    </div>
                  </div>
                ) : (
                  <div className="h-60 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 bg-slate-50/30">
                    <div className="p-3 bg-white rounded-full border border-slate-100 shadow-xs mb-3 text-slate-400">
                      <Terminal size={22} />
                    </div>
                    <h4 className="text-xs font-bold text-slate-800">Ready to Analyze Bug</h4>
                    <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                      {bugLoading ? "Analyzing stack trace and compiling structural remedy..." : "Paste your bug or console error code in the left form and hit Explain Bug to generate code diagnostics."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
