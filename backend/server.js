import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------------- CONFIG ----------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ⚡ Add this in your Render env
});

// ---------------- ROUTES ----------------

// ✅ Default route
app.get("/", (req, res) => {
  res.send("⚡ Spark Backend is Live!");
});

// ✅ Generate Startup Ideas
app.post("/generate-ideas", async (req, res) => {
  const { topic } = req.body;
  try {
    const prompt = `
You are Spark AI — a startup idea generator.
Generate 3 creative startup ideas in JSON format for the topic: "${topic}".

Each idea must include:
{
  "name": "Startup name",
  "problem": "What problem it solves",
  "solution": "How it solves it",
  "why": "Why it could work"
}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content;

    // Try to parse JSON safely
    let ideas;
    try {
      ideas = JSON.parse(text);
    } catch {
      ideas = [{ name: "Parse Error", problem: text }];
    }

    res.json({ ideas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate ideas." });
  }
});

// ✅ Rank / Analyze Startup Idea
app.post("/rank-idea", async (req, res) => {
  const { idea } = req.body;
  try {
    const prompt = `
You are Spark AI, a startup mentor and critic.
Evaluate this idea: "${idea}"

Provide your answer in JSON format:
{
  "rating": "number out of 10",
  "pros": "list main strengths",
  "cons": "list weaknesses or risks",
  "market": "describe potential market opportunity"
}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { rating: "N/A", pros: text, cons: "", market: "" };
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to rank idea." });
  }
});

// ✅ Consultant Chat (Full Conversation)
app.post("/consultant", async (req, res) => {
  const { message } = req.body;
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Spark Consultant, a friendly and insightful startup mentor. Give clear, structured, conversational feedback and next steps.",
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process chat." });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Spark backend running on port ${PORT}`));
