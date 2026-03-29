import { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return alert("Upload resume first");

    const formData = new FormData();
    formData.append("resume", file);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/upload", formData);
      setResult(res.data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-6">AI Resume Analyzer 🚀</h1>

      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md text-center">
        <input
          type="file"
          className="mb-4"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={handleUpload}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg w-full"
        >
          Analyze Resume
        </button>

        {loading && <p className="mt-4">Analyzing...</p>}
      </div>

      {result && (
        <div className="bg-gray-800 mt-6 p-6 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2">Score: {result.score}/100</h2>

          <h3 className="mt-4 font-semibold">Missing Skills:</h3>
          <ul className="list-disc list-inside">
            {result.missing_skills.map((skill, i) => (
              <li key={i}>{skill}</li>
            ))}
          </ul>

          <h3 className="mt-4 font-semibold">Improvements:</h3>
          <ul className="list-disc list-inside">
            {result.improvements.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
