// Pro-level AI Resume Analyzer Backend
require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const axios = require("axios");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "Too many requests. Please wait a minute and try again." },
});

app.use(helmet());
app.use(
  cors({
    origin: "https://ai-resume-analyzer-orcin-rho.vercel.app",
    methods: ["GET", "POST"],
  }),
);
app.use(express.json());
app.use("/upload", limiter);

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed!"));
    }
    cb(null, true);
  },
});

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

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
        timeout: 30000,
      },
    );

    const raw = response.data.choices[0].message.content;
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;

    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return {
        score: 0,
        missing_skills: [],
        improvements: ["AI could not analyze the resume. Please try again."],
      };
    }

    if (
      typeof parsed.score !== "number" ||
      !Array.isArray(parsed.missing_skills) ||
      !Array.isArray(parsed.improvements)
    ) {
      return {
        score: 0,
        missing_skills: [],
        improvements: ["AI returned incomplete data. Please try again."],
      };
    }

    return parsed;
  } catch (error) {
    console.error("AI ERROR:", error.response?.data || error.message);
    return { error: "AI failed" };
  }
}

app.post("/upload", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const data = await pdfParse(dataBuffer);
    const analysis = await analyzeResume(data.text);

    fs.unlinkSync(req.file.path);

    res.json({
      message: "Analysis complete ✅",
      analysis,
    });
  } catch (error) {
    console.error("SERVER ERROR:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
