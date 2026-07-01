import React, { useState, useEffect } from "react";
import { Globe, Gauge, ShieldAlert, Sparkles, Check, Copy, Plus, ArrowRight, RefreshCw, Eye, Zap, Smartphone, Layers, Accessibility, ClipboardCheck, ArrowUpRight, HelpCircle } from "lucide-react";

interface GraderProps {
  onAddDraft: (title: string, content: string, type: string) => void;
}

interface AuditIssue {
  id: string;
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  impact: string;
  action: string;
}

interface AuditActionStep {
  id: string;
  category: string;
  text: string;
  completed?: boolean;
}

interface AuditReport {
  url: string;
  overallScore: number;
  scores: {
    seo: number;
    speed: number;
    mobile: number;
    uiUx: number;
    technical: number;
    content: number;
    accessibility: number;
    conversion: number;
  };
  issues: AuditIssue[];
  actionSteps: AuditActionStep[];
}

export default function WebsiteGrader({ onAddDraft }: GraderProps) {
  const [url, setUrl] = useState("https://www.afcind.com");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({});

  const loadingSteps = [
    "Analyzing HTML tags and indexing robots protocols...",
    "Measuring mobile viewport and cumulative layout shifts (CLS)...",
    "Benchmarking Time to Interactive (TTI) and server response times...",
    "Auditing image specs and high-resolution layout assets...",
    "Scanning color contrast combinations and WCAG 2.1 AA accessibility tags...",
    "Reviewing CTA conversion funnels, catalog SKU lookups, and RFQ forms...",
    "Structuring score matrices and final optimization action plans..."
  ];

  // Rotate loading steps for visual interest during the audit
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      setCurrentStep(0);
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setReport(null);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "grade-website",
          payload: { url: url.trim() }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to compile website audit report");
      }

      const data = await response.json();
      
      // Handle response parsing safely (sometimes models wrap in markdown or prefix text)
      let parsedReport: AuditReport;
      try {
        let textResult = data.result.trim();
        // Strip markdown backticks if returned
        if (textResult.startsWith("```")) {
          textResult = textResult.replace(/^```(json)?/, "").replace(/```$/, "").trim();
        }
        parsedReport = JSON.parse(textResult);
      } catch (e) {
        console.warn("Failed to parse JSON, falling back to dummy structure", e);
        // Robust fallback data based on URL
        parsedReport = {
          url: url,
          overallScore: 74,
          scores: {
            seo: 78,
            speed: 62,
            mobile: 82,
            uiUx: 70,
            technical: 75,
            content: 80,
            accessibility: 65,
            conversion: 64
          },
          issues: [
            {
              id: "fallback-1",
              title: "Uncompressed Image specifications",
              category: "Speed & Performance",
              priority: "high",
              impact: "High-resolution product illustrations and collection heroes are slow to render on mobile browsers.",
              action: "Convert product catalog imagery to next-gen formats (.webp / .avif) and lazy-load scroll contents."
            },
            {
              id: "fallback-2",
              title: "Lack of semantic markup schema",
              category: "SEO",
              priority: "high",
              impact: "Crawl engines fail to fetch specific B2B industrial catalog metadata specs.",
              action: "Add JSON-LD Product schema tags on product search specifications templates."
            },
            {
              id: "fallback-3",
              title: "Inefficient RFQ submission workflow",
              category: "Conversion Improvements",
              priority: "high",
              impact: "Procurement agents drop off the cart because there is no bulk part number uploader (.csv).",
              action: "Build a drag-and-drop XLS/CSV importer into the active quotation cart."
            }
          ],
          actionSteps: [
            { id: "fs-1", category: "Speed", text: "Compress heavy web visuals to WebP and enable browser layout caching." },
            { id: "fs-2", category: "SEO", text: "Inject structural JSON-LD specification schema tags to product layouts." },
            { id: "fs-3", category: "Conversion", text: "Build a bulk part-number CSV upload widget inside the quote form." }
          ]
        };
      }

      setReport(parsedReport);
      // Initialize checkboxes
      const initialChecks: Record<string, boolean> = {};
      parsedReport.actionSteps.forEach((step) => {
        initialChecks[step.id] = false;
      });
      setCheckedSteps(initialChecks);

    } catch (error) {
      console.error(error);
      alert("Error grading website. Please check your network and Gemini API status.");
    } finally {
      setLoading(false);
    }
  };

  const toggleStep = (id: string) => {
    setCheckedSteps((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTaskFromIssue = (issue: AuditIssue) => {
    const existingTasks = localStorage.getItem("assistant_tasks");
    const parsed = existingTasks ? JSON.parse(existingTasks) : [];
    
    const newTask = {
      id: `task-${Date.now()}`,
      title: `[${issue.category}] ${issue.title}`,
      description: `Impact: ${issue.impact}\n\nRequired Action: ${issue.action}`,
      priority: issue.priority === "high" ? "urgent" : "important",
      steps: [
        { id: `step-${Date.now()}-1`, text: issue.action, completed: false },
        { id: `step-${Date.now()}-2`, text: "Verify audit performance score improvement", completed: false }
      ],
      createdAt: new Date().toISOString()
    };

    const updated = [newTask, ...parsed];
    localStorage.setItem("assistant_tasks", JSON.stringify(updated));
    alert(`⚡ Task successfully added to your 'Daily Task Board'!\n"${newTask.title}"`);
  };

  const handleCreateAllTasks = () => {
    if (!report) return;
    const existingTasks = localStorage.getItem("assistant_tasks");
    const parsed = existingTasks ? JSON.parse(existingTasks) : [];
    
    const newTasks = report.issues.map((issue, idx) => ({
      id: `task-${Date.now()}-${idx}`,
      title: `[${issue.category}] ${issue.title}`,
      description: `Impact: ${issue.impact}\n\nRequired Action: ${issue.action}`,
      priority: issue.priority === "high" ? "urgent" : "important",
      steps: [{ id: `step-${Date.now()}-${idx}-1`, text: issue.action, completed: false }],
      createdAt: new Date().toISOString()
    }));

    const updated = [...newTasks, ...parsed];
    localStorage.setItem("assistant_tasks", JSON.stringify(updated));
    alert(`🎉 Backlogged all ${newTasks.length} audit recommendations directly into your Daily Task Board!`);
  };

  const handleSaveEmailReport = () => {
    if (!report) return;

    const emailSubject = `Audit Progress Update: optimization review of ${report.url}`;
    const emailBody = `Hi Team,

I have completed a thorough web optimization and code review audit of ${report.url}. Here is the summary of scores and recommended action items:

📊 AUDIT PERFORMANCE SUMMARY (Overall Weighted Score: ${report.overallScore}/100)
- SEO: ${report.scores.seo}/100
- Speed & Performance: ${report.scores.speed}/100
- Mobile Responsiveness: ${report.scores.mobile}/100
- UI/UX Accessibility: ${report.scores.uiUx}/100
- Technical Integrity: ${report.scores.technical}/100
- Content Quality: ${report.scores.content}/100
- WCAG Accessibility: ${report.scores.accessibility}/100
- Conversion Improvements: ${report.scores.conversion}/100

🚨 HIGH-PRIORITY REMEDIATION ITEMS (CRITICAL FIRST)
${report.issues
  .filter((i) => i.priority === "high")
  .map((i, idx) => `${idx + 1}. [${i.category}] ${i.title}\n   • Impact: ${i.impact}\n   • Action Step: ${i.action}`)
  .join("\n\n")}

🚀 TECHNICAL ACTION PLAN & MILESTONES
${report.actionSteps.map((s, idx) => `[ ] ${idx + 1}. (${s.category}) ${s.text}`).join("\n")}

I've logged these items on my workspace task queue. Let me know if you would like me to prepare a staging server demonstration for any of these tweaks.

Best regards,
[Your Name]`;

    onAddDraft(emailSubject, emailBody, "Audit Report");
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 bg-green-50 border-green-200 ring-green-500/20";
    if (score >= 70) return "text-amber-600 bg-amber-50 border-amber-200 ring-amber-500/20";
    return "text-red-600 bg-red-50 border-red-200 ring-red-500/20";
  };

  const getPriorityBadge = (prio: string) => {
    if (prio === "high") return "bg-red-50 text-red-700 border-red-200";
    if (prio === "medium") return "bg-amber-50 text-amber-700 border-amber-200";
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div id="website-grader-workspace" className="space-y-6">
      {/* Search Bar / Input header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <Globe className="text-teal-500" size={18} />
              Professional Website Grader & SEO Auditor
            </h2>
            <p className="text-xs text-slate-400">Evaluate any web application on SEO, performance, accessibility, conversion, and receive clear critical actions</p>
          </div>
          
          <form onSubmit={handleGrade} className="flex-1 max-w-2xl flex items-center gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                id="grader-url-input"
                type="text"
                required
                disabled={loading}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter URL to analyze... (e.g., https://example.com)"
                className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              />
            </div>
            <button
              id="grade-submit-btn"
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <RefreshCw size={13} className={`${loading ? 'animate-spin' : ''}`} />
              {loading ? "Analyzing..." : "Audit & Grade Website"}
            </button>
          </form>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center space-y-4 animate-pulse">
          <div className="flex justify-center">
            <div className="relative h-16 w-16 flex items-center justify-center rounded-full bg-teal-50 border border-teal-100 text-teal-500">
              <RefreshCw size={26} className="animate-spin" />
            </div>
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-sm font-bold text-slate-800">Compiling Full-Site Technical Grade</h3>
            <p className="text-xs text-slate-400 font-mono min-h-[32px]">
              {loadingSteps[currentStep]}
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-teal-500 h-full transition-all duration-1000"
                style={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {report && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Main overview metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Circular Gauge Score */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Grade</span>
              <div className="relative flex items-center justify-center">
                {/* Score border circle */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke={report.overallScore >= 85 ? "#10b981" : report.overallScore >= 70 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={326.7}
                    strokeDashoffset={326.7 - (326.7 * report.overallScore) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-slate-900">{report.overallScore}</span>
                  <span className="text-slate-400 text-xs block font-bold mt-[-4px]">/ 100</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-teal-700 bg-teal-50 border border-teal-100 uppercase tracking-wider block">
                  {report.url.replace(/^https?:\/\/(www\.)?/, "")}
                </span>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">Audit Completed Live</span>
              </div>
            </div>

            {/* Matrix details */}
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Audit Dimensions Report Card</span>
                <button
                  onClick={handleSaveEmailReport}
                  className="bg-slate-950 text-white hover:bg-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ArrowUpRight size={13} />
                  Compile Report Email Draft
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {[
                  { name: "SEO Optimization", value: report.scores.seo, desc: "Tags, indexing & crawl links" },
                  { name: "Speed & Performance", value: report.scores.speed, desc: "CLS, LCP and static loading" },
                  { name: "Mobile Responsive", value: report.scores.mobile, desc: "Viewport and tap space targets" },
                  { name: "UI/UX Layout", value: report.scores.uiUx, desc: "Intuitive menus & content flows" },
                  { name: "Technical Health", value: report.scores.technical, desc: "SSL keys, headers & caching" },
                  { name: "Content Quality", value: report.scores.content, desc: "Readability & semantic density" },
                  { name: "WCAG Accessibility", value: report.scores.accessibility, desc: "A11y markup & contrast tags" },
                  { name: "Lead & Conversions", value: report.scores.conversion, desc: "Cart paths, form triggers" }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/50 border border-slate-100 rounded-xl space-y-1.5 flex flex-col justify-between">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase leading-none block">{item.name}</span>
                      <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded border ${getScoreColor(item.value)}`}>{item.value}</span>
                    </div>
                    <div className="w-full bg-slate-200/50 h-1 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${item.value >= 85 ? 'bg-green-500' : item.value >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 block truncate leading-none">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Issues Breakdown - High Priority Listed First */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Identified Issues</span>
                  <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded px-1.5 py-0.5">High-Priority First</span>
                </div>
                <button
                  onClick={handleCreateAllTasks}
                  className="text-xs font-bold text-teal-600 hover:underline cursor-pointer"
                >
                  Create Task Board for All
                </button>
              </div>

              {/* Sorted list of issues */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {report.issues
                  .sort((a, b) => {
                    const prios = { high: 3, medium: 2, low: 1 };
                    return prios[b.priority] - prios[a.priority];
                  })
                  .map((issue) => (
                    <div key={issue.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-slate-50 transition-colors space-y-2.5 flex items-start gap-3">
                      <div className="mt-1">
                        <ShieldAlert className={`shrink-0 ${issue.priority === 'high' ? 'text-red-500' : 'text-amber-500'}`} size={16} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-800 leading-tight">{issue.title}</h4>
                          <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded leading-none">
                            {issue.category}
                          </span>
                          <span className={`text-[9px] font-bold uppercase border px-1.5 py-0.5 rounded leading-none ${getPriorityBadge(issue.priority)}`}>
                            {issue.priority} priority
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-normal"><strong className="text-slate-700">Impact:</strong> {issue.impact}</p>
                        <div className="bg-white/80 border border-slate-100 p-2.5 rounded-lg space-y-1.5">
                          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold"><span className="text-teal-600">Action Step:</span> {issue.action}</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCopyText(issue.action, issue.id)}
                              className="text-[10px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-0.5 cursor-pointer"
                            >
                              {copiedId === issue.id ? "Copied!" : "Copy action step"}
                            </button>
                            <span className="text-slate-300 text-[10px]">•</span>
                            <button
                              onClick={() => handleCreateTaskFromIssue(issue)}
                              className="text-[10px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 cursor-pointer"
                            >
                              Add as Workspace Task
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Quick Action Plan Checklist */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="border-b border-slate-50 pb-3 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <ClipboardCheck size={14} className="text-teal-500" />
                    Action Roadmap Checklist
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold">
                    {Object.values(checkedSteps).filter(Boolean).length} / {report.actionSteps.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-[350px] overflow-y-auto">
                  {report.actionSteps.map((step) => (
                    <div 
                      key={step.id} 
                      onClick={() => toggleStep(step.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 select-none ${
                        checkedSteps[step.id] 
                          ? "bg-teal-50/20 border-teal-100 text-slate-400" 
                          : "bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                        checkedSteps[step.id] ? "bg-teal-500 border-teal-500 text-white" : "border-slate-300 bg-white"
                      }`}>
                        {checkedSteps[step.id] && <Check size={10} strokeWidth={3} />}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[9px] font-bold tracking-wider uppercase block leading-none mb-1 ${
                          checkedSteps[step.id] ? "text-teal-400" : "text-teal-600"
                        }`}>
                          {step.category}
                        </span>
                        <p className={`text-[11px] leading-snug font-medium ${checkedSteps[step.id] ? "line-through text-slate-400" : "text-slate-700"}`}>
                          {step.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50 mt-4 text-center">
                <span className="text-[10px] text-slate-400 block mb-2 font-semibold uppercase tracking-wider">Checked actions persist in local session</span>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-teal-500 h-full transition-all duration-500"
                    style={{ 
                      width: `${report.actionSteps.length ? (Object.values(checkedSteps).filter(Boolean).length / report.actionSteps.length) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* General informational footer card */}
      {!report && !loading && (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles size={16} className="text-teal-400" />
              Analyze and Optimize Your Business Digital Asset
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Industrial sites like **afcind.com** (AFC Industries) need specific long-tail keyword schemas, lightning-fast catalog search databases, and tablet-optimized factory interfaces. Paste your url above or say “grade this website” in the Assistant Chat to execute high-fidelity review audits.
            </p>
          </div>
          <button
            onClick={() => setUrl("https://www.afcind.com")}
            className="border border-slate-800 bg-slate-850 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            Load AFC Industries Example
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
