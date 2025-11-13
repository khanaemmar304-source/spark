import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("✅ Spark backend is running!");
});

// 🔹 Generate Startup Ideas
app.post("/generate-ideas", async (req, res) => {
  const { topic } = req.body;
  try {
    const prompt = `
You are Spark AI, a startup idea generator.
Generate 3 creative startup ideas for the topic: "${topic}".

Each idea should be a JSON object like:
{
  "name": "Idea Name",
  "problem": "Problem it solves",
  "solution": "Short description of the solution",
  "why": "Why it can succeed"
}

Return all ideas as a JSON array.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content.trim();
    const ideas = JSON.parse(text);
    res.json({ ideas });
  } catch (err) {
    console.error("❌ Error generating ideas:", err);
    res.status(500).json({ error: "Failed to generate ideas." });
  }
});

// 🔹 Rank My Idea
app.post("/rank-idea", async (req, res) => {
  const { idea } = req.body;
  try {
    const prompt = `
You are Spark AI, a startup mentor and critic.
Evaluate this idea: "${idea}"

Provide your answer strictly in JSON format:
{
  "rating": "number out of 10",
  "pros": ["main strengths"],
  "cons": ["weaknesses or risks"],
  "market": "describe potential market opportunity"
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content.trim();
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (err) {
    console.error("❌ Error ranking idea:", err);
    res.status(500).json({ error: "Failed to rank idea." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
