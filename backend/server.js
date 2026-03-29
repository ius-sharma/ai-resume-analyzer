require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// 🔹 Home route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// 🔹 AI Function
async function analyzeResume(text) {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `
Analyze the following resume and return ONLY valid JSON.

Format:
{
  "score": number,
  "missing_skills": [],
  "improvements": []
}

Rules:
- Do NOT wrap response in backticks
- Do NOT add explanations
- Return only JSON

Resume:
${text}
            `,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const raw = response.data.choices[0].message.content;

    // 🔥 Clean AI response
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      parsed = {
        error: "Invalid JSON from AI",
        raw,
      };
    }

    return parsed;
  } catch (error) {
    console.error("AI ERROR:", error.response?.data || error.message);
    return { error: "AI failed" };
  }
}

// 🔹 Upload + Analyze Route
app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Step 1: Read PDF
    const dataBuffer = fs.readFileSync(req.file.path);

    // Step 2: Extract text
    const data = await pdfParse(dataBuffer);

    // Step 3: Analyze with AI
    const analysis = await analyzeResume(data.text);

    res.json({
      message: "Analysis complete ✅",
      analysis,
    });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// 🔹 Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
