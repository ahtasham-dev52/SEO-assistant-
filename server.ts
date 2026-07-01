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
- The user is a developer/consultant working with web development (React, Laravel, WordPress, HubSpot, SEO, Vercel, DNS, etc.).`;

    const response = await ai.models.generateContent({
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
    } else {
      prompt = payload.prompt;
    }

    const response = await ai.models.generateContent({
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
