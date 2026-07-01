import React, { useState } from "react";
import { HelpCircle, Sparkles, Copy, Check, Bookmark, FileText, ArrowRight, Table, ShieldAlert } from "lucide-react";

interface DecisionHubProps {
  onAddDraft: (title: string, content: string, type: string) => void;
}

export default function DecisionHub({ onAddDraft }: DecisionHubProps) {
  const [optionsText, setOptionsText] = useState("");
  const [customCriteria, setCustomCriteria] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!optionsText.trim()) return;

    // Parse options split by commas or line breaks
    const options = optionsText
      .split(/[,\n]/)
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (options.length < 2) {
      alert("Please enter at least 2 options to compare.");
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "decision-matrix",
          payload: {
            options,
            criteria: customCriteria
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate decision matrix");
      }

      const data = await response.json();
      setResult(data.result);
    } catch (error: any) {
      console.error(error);
      setResult(`❌ Error comparing options: ${error.message || "Failed to connect to Gemini."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const title = `Comparison: ${optionsText.substring(0, 30)}...`;
    onAddDraft(title, result, "Decision Support");
  };

  const loadExample = (type: string) => {
    if (type === "tech") {
      setOptionsText("Laravel custom-built e-commerce system, WordPress + WooCommerce, Shopify Store");
      setCustomCriteria("Need to connect with an on-premises ERP warehouse database.");
    } else if (type === "server") {
      setOptionsText("Self-managed VPS (DigitalOcean/Linode), Managed hosting (Cloudways/WPEngine), Serverless containers (Google Cloud Run/AWS ECS)");
      setCustomCriteria("Client has zero sysadmin expertise; requires auto-updates.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Parameters Panel */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Table size={16} className="text-teal-500" />
              Decision Criteria
            </h3>
            <span className="text-[10px] text-slate-400">Gemini Evaluator</span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => loadExample("tech")}
              className="text-[10px] font-semibold text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Load Custom ERP vs CMS
            </button>
            <button
              onClick={() => loadExample("server")}
              className="text-[10px] font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Load VPS vs Serverless
            </button>
          </div>

          <form onSubmit={handleCompare} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 flex justify-between">
                <span>Options to Compare</span>
                <span className="text-[10px] text-slate-400">Min. 2 items</span>
              </label>
              <textarea
                required
                rows={3}
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="e.g. Host on cPanel VPS, Host on AWS Elastic Beanstalk, Host on Vercel Pro"
                className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Custom Constraints or Specific Target (Optional)</label>
              <input
                type="text"
                value={customCriteria}
                onChange={(e) => setCustomCriteria(e.target.value)}
                placeholder="e.g. Speed is absolute priority, budget limit $50/mo, zero downtime needed"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !optionsText.trim()}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <Sparkles size={13} className="text-teal-400" />
              {loading ? "Analyzing variables..." : "Compare & Get Recommendation"}
            </button>
          </form>

          <hr className="border-slate-100" />

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
            <h5 className="text-[10px] font-bold text-slate-700 uppercase flex items-center gap-1">
              <ShieldAlert size={11} className="text-amber-500" />
              Analytical Framework
            </h5>
            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
              Comparison is automatically evaluated using a comprehensive criteria weight matrix: Cost, Practical Implementation, Security/Safety, Long-term Value, Operational Risk, Maintenance Overhead, and custom parameters.
            </p>
          </div>
        </div>
      </div>

      {/* Results output area */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm min-h-[400px] flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Side-by-Side Matrix Summary</h3>
                <p className="text-xs text-slate-400">Qualitative comparison and recommendation report</p>
              </div>
            </div>

            {result ? (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Decision Support Report</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 hover:bg-slate-100 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-green-500" />
                          <span className="text-green-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy Report</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 text-[11px] font-semibold text-white bg-slate-900 rounded-lg px-2.5 py-1.5 hover:bg-slate-800 cursor-pointer"
                    >
                      Save Report
                    </button>
                  </div>
                </div>

                {/* Styled output card */}
                <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-4 font-sans text-xs leading-relaxed text-slate-700 whitespace-pre-wrap max-h-[350px] overflow-y-auto">
                  {result}
                </div>
              </div>
            ) : (
              <div className="h-60 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-6 bg-slate-50/30">
                <div className="p-3 bg-white rounded-full border border-slate-100 shadow-xs mb-3 text-slate-400">
                  <HelpCircle size={22} className="text-slate-400" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 font-sans">Ready to Compare Options</h4>
                <p className="text-[11px] text-slate-400 max-w-sm mt-1 leading-relaxed">
                  {loading ? "Gemini is performing qualitative modeling across all constraints..." : "Submit two or more candidate technologies, systems, or host providers. Our evaluation engine will map pros, cons, risk profile, and render a definitive path forward."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
