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

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, "frontend")));

// Root route — serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// API route
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
            content: `Give 3 startup ideas in JSON format for topic: ${topic}.
                      Each should include name, problem, solution, and why.`,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    let ideas;
    try {
      ideas = JSON.parse(text);
    } catch {
      console.log("Could not parse ideas. Returning raw text.");
      ideas = [{ raw: text }];
    }

    res.json({ ideas });
  } catch (error) {
    console.error("Error generating ideas:", error);
    res.status(500).json({ error: "Failed to generate ideas" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`⚡ Spark running on port ${PORT}`);
});
