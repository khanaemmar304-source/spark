import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// OpenAI client setup
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// --- Root route just for Render health check ---
app.get("/", (req, res) => {
  res.send("⚡ Spark backend is live!");
});

// --- Generate Ideas Route ---
app.post("/generate-ideas", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required." });
  }

  try {
    const prompt = `
You are Spark AI, a professional startup idea generator.

Generate 3 unique startup ideas for the industry/topic: "${topic}".
Output MUST be valid JSON in the following format ONLY:

{
  "ideas": [
    {
      "name": "Idea Name",
      "problem": "Describe the problem",
      "solution": "Describe the solution",
      "why": "Why it will work"
    }
  ]
}
Do not include anything else outside JSON.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const rawText = completion.choices[0].message.content?.trim();

    // Try to extract valid JSON even if model adds stray text
    let jsonText = rawText;
    const firstBrace = rawText.indexOf("{");
    const lastBrace = rawText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = rawText.slice(firstBrace, lastBrace + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      console.error("❌ Failed to parse GPT output:", rawText);
      return res.status(500).json({
        error: "Failed to parse GPT output. Check backend logs.",
        raw: rawText,
      });
    }

    res.json(parsed);
  } catch (err) {
    console.error("❌ Server error:", err);
    res.status(500).json({ error: "Error generating ideas." });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⚡ Spark backend running on port ${PORT}`));
