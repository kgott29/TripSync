// ==========================================================================
// TripSync — Backend
// A tiny Express server with ONE job: keep the Gemini API key off the
// client.
// - POST /api/itinerary          → waits for the full answer, returns it as JSON
// - POST /api/itinerary/stream   → streams the answer as it's generated (SSE)
// Either way, the key stays in .env, never sent to the browser.
// ==========================================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());          // allows the frontend (different origin/port) to call this server
app.use(express.json());  // parses incoming JSON request bodies

// Health check — visit http://localhost:3001/ to confirm the server is running
app.get("/", (req, res) => {
  res.send("TripSync backend is running.");
});

// POST /api/itinerary
// body: { destination: "Pondicherry", days: 3, groupSize: 5 }
// returns: { suggestion: "Day 1: ..." }
app.post("/api/itinerary", async (req, res) => {
  const { destination, days, groupSize } = req.body;

  if (!destination) {
    return res.status(400).json({ error: "destination is required" });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY — check your .env file" });
  }

  const prompt = `Suggest a ${days || 3}-day trip itinerary for a group of ${groupSize || 4} friends visiting ${destination}. Keep it practical: a short list of things to do per day, no long paragraphs.`;

  try {
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", data);
      return res.status(geminiResponse.status).json({ error: data.error?.message || "Gemini API request failed" });
    }

    const suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text || "No suggestion returned.";
    res.json({ suggestion });
  } catch (err) {
    console.error("Server error calling Gemini:", err);
    res.status(500).json({ error: "Failed to reach Gemini API" });
  }
});

// POST /api/itinerary/stream
// Same input as /api/itinerary, but streams the answer as Server-Sent Events
// (SSE) so the frontend can show it word-by-word as Gemini generates it,
// instead of waiting for the whole response.
app.post("/api/itinerary/stream", async (req, res) => {
  const { destination, days, groupSize } = req.body;

  if (!destination) {
    return res.status(400).json({ error: "destination is required" });
  }
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY — check your .env file" });
  }

  const prompt = `Suggest a ${days || 3}-day trip itinerary for a group of ${groupSize || 4} friends visiting ${destination}. Keep it practical: a short list of things to do per day, no long paragraphs. Format your answer in Markdown (headings per day, bullet points for activities).`;

  try {
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!geminiResponse.ok || !geminiResponse.body) {
      const errData = await geminiResponse.json().catch(() => null);
      return res.status(geminiResponse.status || 500).json({
        error: errData?.error?.message || "Gemini stream request failed"
      });
    }

    // Forward the stream to the browser as it arrives — we don't wait for
    // the full response before sending anything.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = geminiResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (err) {
    console.error("Server error streaming from Gemini:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to reach Gemini API" });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`TripSync backend running at http://localhost:${PORT}`);
});