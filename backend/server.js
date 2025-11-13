import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate-ideas", async (req, res) => {
  const { topic } = req.body;
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
    },
    ...
  ]
}
Do not include anything else outside JSON.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const rawText = completion.choices[0].message.content;

    // Make sure it's valid JSON
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      console.error("Failed to parse GPT output:", rawText);
      return res.status(500).json({ error: "Failed to parse GPT output." });
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating ideas." });
  }
});

app.listen(process.env.PORT || 3000, () =>
  console.log("⚡ Spark backend running on port", process.env.PORT || 3000)
);
