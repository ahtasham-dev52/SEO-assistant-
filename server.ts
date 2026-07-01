import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in the Secrets panel under Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function generateContentWithFallback(ai: GoogleGenAI, options: {
  model: string;
  contents: any;
  config?: any;
}) {
  const modelsToTry = [
    options.model,
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.5-pro'
  ];

  let lastError: any = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`Attempting generateContent with model: ${modelName}`);
      const response = await ai.models.generateContent({
        ...options,
        model: modelName
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err.message || "";
      console.warn(`Model ${modelName} failed. Error: ${errMsg}`);
    }
  }
  throw lastError || new Error("All Gemini models failed to respond");
}

// REST API routes FIRST
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const ai = getGeminiClient();

    // Map client messages to Gemini content format.
    const contents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const systemInstruction = `You are a helpful, practical, and highly skilled Personal AI Assistant.
Your goal is to help the user manage their daily work, planning, productivity, communication, research, writing, decision-making, and task organization.
Preferred working style:
- Draft professional and concise ready-to-send emails, Slack messages, client replies, and WhatsApp messages when requested.
- Provide clear, direct, and actionable steps for task management.
- Keep the tone polite, direct, clear, and highly useful. Avoid overly complex words.
- If asked, explain complex technical concepts in simple beginner-friendly language, or mixed Urdu/Hindi if the user specifies.
- The user is a developer/consultant working with web development (React, Laravel, WordPress, HubSpot, SEO, Vercel, DNS, etc.).

CRITICAL DIRECTIVE ON WEBSITE GRADING:
When the user says "grade this website" or "grade [URL]" (e.g. "grade https://www.afcind.com"), you must act as a Senior Web Auditor & SEO Specialist and grade the website thoroughly across these 8 core dimensions:
1. SEO (Search Engine Optimization)
2. Speed & Performance
3. Mobile Responsiveness
4. UI/UX (User Interface / User Experience)
5. Technical Issues (SSL, broken links, caching, DNS, etc.)
6. Content Quality & Readability
7. Accessibility (A11y, screen readers, contrast)
8. Conversion Improvements (CTAs, lead capture forms, sales funnel)

For your response:
1. Assign clear scores out of 100 for EACH of the 8 dimensions above, plus an Overall Weighted Score out of 100.
2. Structure your response to LIST HIGH-PRIORITY (CRITICAL) ISSUES FIRST.
3. List MEDIUM-PRIORITY and LOW-PRIORITY issues next.
4. For each issue, provide a direct, actionable step or code change recommendation to resolve it.
5. Make sure the audit is realistic and tailored to the website's industry. For instance, if auditing afcind.com, mention B2B fastener catalog SKU search latency, bulk RFQ tables, factory-floor tablet layouts, and VMI portal links. Keep the tone expert, helpful, and highly detailed.`;

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents,
      config: {
        systemInstruction,
      }
    });

    res.json({ content: response.text });
  } catch (error: any) {
    console.error("Error in /api/gemini/chat:", error);
    res.status(500).json({ error: error.message || "An error occurred while contacting the AI." });
  }
});

// Helper: Normalize URL
function normalizeUrl(inputUrl: string): string {
  let cleaned = inputUrl.trim();
  if (!cleaned) {
    throw new Error("URL cannot be empty");
  }
  
  // Strip trailing slashes and spacing
  cleaned = cleaned.replace(/\/+$/, "");
  
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "https://" + cleaned;
  }
  
  try {
    const parsed = new URL(cleaned);
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      throw new Error("Invalid website domain structure");
    }
    return parsed.href;
  } catch (err: any) {
    throw new Error("Invalid website URL format");
  }
}

// Helper: Fetch URL with 8s timeout and user-agent
async function fetchWebsiteHtml(url: string): Promise<{ html: string; fetched: boolean; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SeniorWebAuditor/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        html: "",
        fetched: false,
        error: `HTTP ${response.status} ${response.statusText}`
      };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return {
        html: "",
        fetched: false,
        error: `Expected HTML content type but received "${contentType}"`
      };
    }

    const html = await response.text();
    return { html, fetched: true };
  } catch (err: any) {
    clearTimeout(timeoutId);
    let errMsg = err.message || "Unknown fetching error";
    if (err.name === "AbortError" || err.message?.includes("aborted")) {
      errMsg = "Request timeout (the server took too long to respond)";
    }
    return {
      html: "",
      fetched: false,
      error: errMsg
    };
  }
}

// Helper: Regex metadata extraction
function extractMetadata(html: string, baseUrl: string) {
  let title = "";
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  let description = "";
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) || 
                    html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  if (descMatch) {
    description = descMatch[1].trim();
  }

  let robots = "";
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([\s\S]*?)["']/i) ||
                      html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']robots["']/i);
  if (robotsMatch) {
    robots = robotsMatch[1].trim();
  }

  let canonical = "";
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([\s\S]*?)["']/i);
  if (canonicalMatch) {
    canonical = canonicalMatch[1].trim();
  }

  let hasViewport = false;
  const viewportMatch = html.match(/<meta[^>]*name=["']viewport["']/i);
  if (viewportMatch) {
    hasViewport = true;
  }

  const h1s: string[] = [];
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let match;
  while ((match = h1Regex.exec(html)) !== null && h1s.length < 5) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (text) h1s.push(text);
  }

  const h2s: string[] = [];
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  while ((match = h2Regex.exec(html)) !== null && h2s.length < 8) {
    const text = match[1].replace(/<[^>]*>/g, "").trim();
    if (text) h2s.push(text);
  }

  let totalImages = 0;
  let imagesWithoutAlt = 0;
  const imgRegex = /<img([^>]+)>/gi;
  while ((match = imgRegex.exec(html)) !== null && totalImages < 100) {
    totalImages++;
    const imgAttributes = match[1];
    if (!/alt\s*=\s*["']/i.test(imgAttributes) || /alt\s*=\s*["']\s*["']/i.test(imgAttributes)) {
      imagesWithoutAlt++;
    }
  }

  let internalLinks = 0;
  let externalLinks = 0;
  const linkRegex = /href=["'](https?:\/\/[^\s"'<>]+|#[^\s"'<>]*|\/[^\s"'<>]*)/gi;
  const domainMatch = baseUrl.match(/https?:\/\/([^\/]+)/i);
  const domain = domainMatch ? domainMatch[1] : "";

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith("http")) {
      if (domain && href.includes(domain)) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    } else {
      internalLinks++;
    }
  }

  let hasSchema = false;
  const schemaRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  if (schemaRegex.test(html)) {
    hasSchema = true;
  }

  return {
    title,
    description,
    robots,
    canonical,
    hasViewport,
    h1s,
    h2s,
    totalImages,
    imagesWithoutAlt,
    internalLinks,
    externalLinks,
    hasSchema
  };
}

// 2. Real API Endpoint for Website Grading
app.post("/api/grade-website", async (req, res) => {
  try {
    const { url: rawUrl } = req.body;
    if (!rawUrl) {
      return res.status(400).json({ error: "Invalid website URL", details: "Website URL is required." });
    }

    // Normalize URL
    let targetUrl: string;
    try {
      targetUrl = normalizeUrl(rawUrl);
    } catch (normalizeErr: any) {
      return res.status(400).json({ error: "Invalid website URL", details: normalizeErr.message });
    }

    // Check Gemini API key existence
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return res.status(500).json({
        error: "Missing Gemini API key",
        details: "The GEMINI_API_KEY environment variable is not defined. Please define it in the Secrets panel under Settings."
      });
    }

    const ai = getGeminiClient();

    // Fetch live website content
    const fetchResult = await fetchWebsiteHtml(targetUrl);

    // If website could not be fetched and returned a timeout specifically, let's catch it
    if (!fetchResult.fetched && fetchResult.error?.includes("timeout")) {
      return res.status(504).json({
        error: "Request timeout",
        details: `The server took too long to fetch the live content of "${targetUrl}". Details: ${fetchResult.error}`
      });
    }

    // Note: if website fetch failed other than timeout (e.g. 403, 500, etc), we handle it gracefully inside prompt
    let metadata: any = null;
    if (fetchResult.fetched && fetchResult.html) {
      metadata = extractMetadata(fetchResult.html, targetUrl);
    }

    const systemInstruction = `You are a Senior Web Auditor, SEO Specialist, and Conversion Optimization expert.
Your task is to generate a comprehensive, professional website grade report.
Analyze the target URL and metadata. Ensure your audit is highly realistic and tailored specifically to the website's industry/domain.
You must return valid JSON only. Do not wrap the JSON in markdown blocks or backticks.`;

    const promptText = `Please audit and grade the website: "${targetUrl}".
${fetchResult.fetched && metadata ? `The crawler successfully fetched the homepage. Here is the technical HTML audit data:
- Page Title: "${metadata.title || "None"}"
- Meta Description: "${metadata.description || "None"}"
- Meta Robots tag: "${metadata.robots || "None"}"
- Canonical tag: "${metadata.canonical || "None"}"
- Mobile viewport tag present: ${metadata.hasViewport}
- Headings: H1s: ${JSON.stringify(metadata.h1s)}, H2s: ${JSON.stringify(metadata.h2s)}
- Total <img> tags: ${metadata.totalImages}
- Images missing 'alt' text: ${metadata.imagesWithoutAlt}
- Internal links: ${metadata.internalLinks}
- External links: ${metadata.externalLinks}
- JSON-LD Structured Schema detected: ${metadata.hasSchema}` : `Note: Live fetching failed for "${targetUrl}" with error: "${fetchResult.error || "Connection blocked"}" (likely due to anti-scraping walls, Cloudflare firewall, or region blocks).
Please conduct a high-fidelity synthetic audit of "${targetUrl}" based on your expert knowledge of this business. Include a direct notice/disclaimer in the 'finalSummary' highlighting that live scraping was blocked by the host, and the technical metrics have been synthetically simulated.`}

You MUST return a valid JSON object matching this structure. Do NOT include markdown styling (\`\`\`json). Output ONLY the raw JSON string:
{
  "overallScore": 75,
  "seoScore": 78,
  "performanceScore": 64,
  "accessibilityScore": 68,
  "mobileScore": 80,
  "conversionScore": 65,
  "topIssues": [
    {
      "id": "issue-1",
      "title": "Uncompressed high-resolution images",
      "category": "Speed & Performance",
      "priority": "high",
      "impact": "Slows down initial page load considerably, causing high bounce rates on mobile.",
      "action": "Compress all hero images and product listings using WebP/AVIF format and integrate lazy loading."
    },
    {
      "id": "issue-2",
      "title": "Missing structured schema markup",
      "category": "SEO",
      "priority": "high",
      "impact": "Search engines fail to index B2B product catalogs, fasteners, or service specifications rich data.",
      "action": "Inject JSON-LD Product schema on detail pages and Organization schema on the homepage."
    }
  ],
  "highPriorityFixes": [
    "Compress heavy website visuals and enable browser caching",
    "Deploy product, organization, and local business JSON-LD schemas"
  ],
  "mediumPriorityFixes": [
    "Enlarge tap target sizes to minimum 44x44px for tablet catalog searching filters",
    "Adjust low-contrast footer and search input text colors to conform with WCAG AA"
  ],
  "lowPriorityFixes": [
    "Reference XML sitemaps within your robots.txt file"
  ],
  "recommendations": [
    "Add a drag-and-drop XLS/CSV multi-item part-number uploader directly to the RFQ cart layout"
  ],
  "finalSummary": "Provide an expert summary outlining the site's strongest areas and primary technical opportunities.",
  "url": "${targetUrl}",
  "scores": {
    "seo": 78,
    "speed": 64,
    "mobile": 80,
    "uiUx": 72,
    "technical": 74,
    "content": 82,
    "accessibility": 68,
    "conversion": 65
  },
  "issues": [
    {
      "id": "1",
      "title": "Uncompressed high-resolution images",
      "category": "Speed & Performance",
      "priority": "high",
      "impact": "Slows down initial page load considerably, causing high bounce rates on mobile.",
      "action": "Compress all hero images and product listings using WebP/AVIF format and integrate lazy loading."
    },
    {
      "id": "2",
      "title": "Missing structured schema markup",
      "category": "SEO",
      "priority": "high",
      "impact": "Search engines fail to index B2B product catalogs, fasteners, or service specifications rich data.",
      "action": "Inject JSON-LD Product schema on detail pages and Organization schema on the homepage."
    }
  ],
  "actionSteps": [
    {
      "id": "step-1",
      "category": "Speed",
      "text": "Optimize heavy media files and implement next-gen format formats (WebP/AVIF)."
    },
    {
      "id": "step-2",
      "category": "SEO",
      "text": "Deploy product, organization, and local business JSON-LD schemas."
    }
  ]
}

Note: Double check that the JSON is valid, with all brackets closed, and overallScore is the average of all scores.`;

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "";
    if (!responseText) {
      throw new Error("Gemini API returned an empty response.");
    }

    let cleanJsonStr = responseText.trim();
    if (cleanJsonStr.startsWith("```")) {
      cleanJsonStr = cleanJsonStr.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    let resultJson;
    try {
      resultJson = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      console.error("Gemini invalid JSON output:", cleanJsonStr);
      return res.status(502).json({
        error: "Gemini returned invalid JSON",
        details: "The AI generated response could not be parsed as standard JSON. Please try again."
      });
    }

    res.json(resultJson);

  } catch (error: any) {
    console.error("Error in /api/grade-website:", error);
    res.status(500).json({
      error: "Gemini API failed",
      details: error.message || "An unexpected error occurred during website grading."
    });
  }
});

app.post("/api/gemini/generate", async (req, res) => {
  try {
    const { type, payload } = req.body;
    const ai = getGeminiClient();

    let prompt = "";
    if (type === "email-message") {
      const { description, audience, platform, tone, context } = payload;
      prompt = `Create a ready-to-send draft for a ${platform || "communication"} to a ${audience || "recipient"}.
Context/Details: ${description}
Tone: ${tone || "professional"}
Additional context: ${context || "None"}

Please output ONLY the ready-to-send draft. No conversational preambles or post-conversational chatter, just start directly with the greeting or subject line. Use standard markdown. Add a Subject: header if it is an email.`;
    } else if (type === "bug-explainer") {
      const { code, error, targetAudience } = payload;
      prompt = `Explain the following code issue and error for a ${targetAudience || "beginner"} audience.
Code:
\`\`\`
${code}
\`\`\`
Error message:
\`\`\`
${error}
\`\`\`
Provide:
1. What went wrong (explained simply)
2. Why it went wrong
3. How to fix it (provide a corrected code snippet)
4. Keep the explanation very practical, clear, and direct.`;
    } else if (type === "decision-matrix") {
      const { options, criteria } = payload;
      prompt = `Help me compare the following options: ${options.join(", ")}
Based on the following criteria: Cost, Safety, Long-term Value, Ease of Use, Practical Implementation, Risk, Maintenance, and optionally custom criteria: ${criteria || "None"}.

Provide:
1. A clear structured table comparing the options across these criteria (assign scores or qualitative evaluations like High, Medium, Low).
2. A definitive recommendation on the best option with a brief, high-impact explanation of why.`;
    } else if (type === "progress-report") {
      const { progressPoints, extraContext } = payload;
      prompt = `Format the following progress points into a professional weekly progress report or update:
Points:
${progressPoints}
Additional context: ${extraContext || ""}

Structure it with:
1. A polite professional introduction.
2. Formatted progress points (broken down into completed, ongoing, and next steps).
3. Ready-to-send email content suitable for a manager or team lead.`;
    } else if (type === "site-analyzer") {
      const { url } = payload;
      prompt = `The user wants to optimize and test their website: ${url}.
Based on professional B2B industrial distribution and web development best practices (especially for a site like AFC Industries, a major distributor of fasteners, tooling, and supply chain solutions):
1. Provide 5-6 critical, highly practical optimization recommendations (covering speed/performance, mobile responsiveness, B2B user experience/UX, SEO metadata, lead forms, and VMI client portals).
2. Draft a highly polished, professional ready-to-send email to their manager summarizing this week's progress on testing/optimizing this site, framing the recommendations as key action steps we're taking.
Keep the recommendations extremely realistic and useful for a site like afcind.com.`;
    } else if (type === "grade-website") {
      const { url } = payload;
      prompt = `Review and grade the website: "${url}" for SEO, speed, mobile responsiveness, UI/UX, technical issues, content quality, accessibility, and conversion improvements.
Assign scores out of 100 for each of these 8 categories. List high-priority issues first, and provide clear action steps to improve.
You MUST respond with a valid JSON object matching the following structure. Do NOT include any markdown block markers like \`\`\`json or backticks. Return ONLY the raw JSON text:
{
  "url": "${url}",
  "overallScore": 76,
  "scores": {
    "seo": 78,
    "speed": 64,
    "mobile": 80,
    "uiUx": 72,
    "technical": 74,
    "content": 82,
    "accessibility": 68,
    "conversion": 65
  },
  "issues": [
    {
      "id": "1",
      "title": "Uncompressed high-resolution images",
      "category": "Speed & Performance",
      "priority": "high",
      "impact": "Slows down initial page load considerably, causing high bounce rates on mobile.",
      "action": "Compress all hero images and product listings using WebP/AVIF format and integrate lazy loading."
    },
    {
      "id": "2",
      "title": "Missing structured schema markup",
      "category": "SEO",
      "priority": "high",
      "impact": "Search engines fail to index specific products, fasteners, or service specifications rich data.",
      "action": "Inject JSON-LD Product schema on detail pages and Organization schema on the homepage."
    },
    {
      "id": "3",
      "title": "Inadequate touch target sizing for shop-floor tablets",
      "category": "Mobile Responsiveness",
      "priority": "high",
      "impact": "Field engineers and shop-floor operators struggle to click small catalog search filters.",
      "action": "Increase CTA buttons and list filters to minimum 44x44px and widen cell spacing."
    },
    {
      "id": "4",
      "title": "Low color contrast on secondary navigation links",
      "category": "Accessibility",
      "priority": "medium",
      "impact": "Users with minor visual impairment cannot easily read category or specification headers.",
      "action": "Adjust link colors to pass WCAG 2.1 AA color contrast ratio requirements of 4.5:1."
    },
    {
      "id": "5",
      "title": "No RFQ bulk upload capability",
      "category": "Conversion Improvements",
      "priority": "medium",
      "impact": "Industrial procurement officers abandon custom requests when forced to manually input 50+ part numbers.",
      "action": "Add a drag-and-drop .csv / .xlsx file uploader directly in the RFQ section."
    }
  ],
  "actionSteps": [
    {
      "id": "step-1",
      "category": "Speed",
      "text": "Optimize heavy media files and implement next-gen format formats (WebP/AVIF)."
    },
    {
      "id": "step-2",
      "category": "SEO",
      "text": "Deploy product, organization, and local business JSON-LD schemas."
    },
    {
      "id": "step-3",
      "category": "Mobile",
      "text": "Expand mobile responsive touch targets and container padding on tablet resolutions."
    },
    {
      "id": "step-4",
      "category": "Accessibility",
      "text": "Verify WCAG AA color contrast on secondary links and add alt attributes to key product photos."
    },
    {
      "id": "step-5",
      "category": "Conversion",
      "text": "Introduce a bulk CSV part-number upload feature inside the Quote form."
    },
    {
      "id": "step-6",
      "category": "Technical",
      "text": "Verify SSL validation protocols, clean up duplicate canoncial links, and setup browser caching headers."
    }
  ]
}

Make sure to adjust the scores and specific descriptions to represent an actual realistic audit of the requested URL: ${url}. If it's afcind.com, focus on fasteners, B2B procurement, tooling catalogues, and industrial user workflows. Ensure overallScore is the average of the 8 scores. Output ONLY the JSON.`;
    } else {
      prompt = payload.prompt;
    }

    const response = await generateContentWithFallback(ai, {
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Error in /api/gemini/generate:", error);
    res.status(500).json({ error: error.message || "An error occurred while generating content." });
  }
});

// Vite middleware for development or static server for production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
