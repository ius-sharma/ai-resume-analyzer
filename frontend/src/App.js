// Pro-level AI Resume Analyzer Frontend
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function AnimatedScore({ target }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const step = 16;
    const increment = target / (duration / step);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, step);

    return () => clearInterval(timer);
  }, [target]);

  return <p className="mt-2 text-lg font-bold">{display}/100</p>;
}

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const handleUpload = async () => {
    setError("");
    if (!file) {
      setError("Please upload your resume first.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      const res = await axios.post(
        "https://ai-resume-analyzer-fixb.onrender.com/upload",
        formData,
      );
      setResult(res.data.analysis);
    } catch (err) {
      setError("Failed to analyze resume.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed!");
      return;
    }
    if (droppedFile && droppedFile.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB!");
      return;
    }
    setFile(droppedFile);
    setError("");
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 
      bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#020617] text-white"
    >
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          AI Resume Analyzer
        </h1>
        <p className="text-gray-400 mt-3">
          Get instant AI-powered resume feedback
        </p>
      </div>

      {/* Upload Card */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
        className="backdrop-blur-lg bg-white/10 border border-white/20 
        shadow-xl p-8 rounded-2xl w-full max-w-md text-center 
        cursor-pointer hover:scale-[1.02] transition"
      >
        <p className="text-gray-300 mb-4">
          Drag & drop your resume or{" "}
          <span className="underline text-blue-400">click to upload</span>
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files[0];
            if (selected && selected.type !== "application/pdf") {
              setError("Only PDF files are allowed!");
              setFile(null);
              return;
            }
            if (selected && selected.size > 5 * 1024 * 1024) {
              setError("File size must be less than 5MB!");
              setFile(null);
              return;
            }
            setFile(selected);
            setError("");
          }}
        />

        {file && (
          <p className="text-green-400 text-sm mb-2">Selected: {file.name}</p>
        )}

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleUpload();
          }}
          disabled={loading}
          className={`mt-4 w-full py-2 rounded-lg font-semibold 
          bg-gradient-to-r from-blue-500 to-purple-500 
          transition ${loading ? "opacity-50 cursor-not-allowed" : "hover:opacity-90 cursor-pointer"}`}
        >
          {loading ? "Analyzing..." : "Analyze Resume"}
        </button>
      </div>

      {/* RESULT */}
      {result && (
        <div className="mt-10 w-full max-w-md space-y-6">
          {/* Score */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-2">Score</h2>
            <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full"
                style={{
                  width: `${result.score}%`,
                  transition: "width 1.5s ease-in-out",
                }}
              ></div>
            </div>
            <AnimatedScore target={result.score} />
          </div>

          {/* Missing Skills */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 p-6 rounded-xl">
            <h3 className="text-blue-400 font-semibold mb-2">Missing Skills</h3>
            {result.missing_skills.length === 0 ? (
              <p className="text-green-400 text-sm">
                🎉 No missing skills found — great resume!
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {result.missing_skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Improvements */}
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 p-6 rounded-xl">
            <h3 className="text-green-400 font-semibold mb-2">Improvements</h3>
            {result.improvements.length === 0 ? (
              <p className="text-green-400 text-sm">
                ✅ No improvements needed — your resume looks great!
              </p>
            ) : (
              <ul className="space-y-2 mt-2">
                {result.improvements.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-300 text-sm"
                  >
                    <span className="text-green-400 mt-0.5">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-12 text-gray-500 text-sm">
        Built with ❤️ using AI - Mind
      </p>
    </div>
  );
}

export default App;
