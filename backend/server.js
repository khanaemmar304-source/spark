import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "frontend"))); // Serve frontend files

// Root route → Login page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// API route → Generate ideas
app.post("/generate-ideas", async (req, res) => {
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Give 3 startup ideas in a JSON array for the topic: ${topic}.
                      Each should have:
                      {
                        "name": "",
                        "problem": "",
                        "solution": "",
                        "why": ""
                      }`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI API");
    }

    let ideasText = data.choices[0].message.content.trim();

    // Ensure we safely parse JSON
    const startIdx = ideasText.indexOf("[");
    const endIdx = ideasText.lastIndexOf("]");
    const cleanText =
      startIdx !== -1 && endIdx !== -1
        ? ideasText.slice(startIdx, endIdx + 1)
        : "[]";

    let ideas = [];
    try {
      ideas = JSON.parse(cleanText);
    } catch {
      console.error("JSON parse failed — raw output:", ideasText);
      return res.status(500).json({ error: "Failed to parse ideas." });
    }

    res.json({ ideas });
  } catch (error) {
    console.error("Error generating ideas:", error);
    res.status(500).json({ error: "Failed to generate ideas" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`⚡ Spark running on port ${PORT}`);
});
