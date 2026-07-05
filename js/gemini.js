// ==========================================================================
// TripSync — Frontend helper for AI itinerary suggestions
// Calls OUR backend (server/server.js), never Gemini directly — the API
// key lives server-side only.
//
// Two ways to get a suggestion:
// - getItinerarySuggestion(...)      → waits for the full answer, returns it
// - streamItinerarySuggestion(...)   → calls onUpdate(text) repeatedly as
//                                       the answer streams in, word by word
//
// Requires marked.js + DOMPurify to be loaded on the page (see group.html)
// for renderMarkdown() to turn Gemini's Markdown into safe, formatted HTML.
// ==========================================================================

const BACKEND_URL = "https://tripsync-fog5.onrender.com"; // deployed backend (was localhost:3001 for local dev)

async function getItinerarySuggestion(destination, days, groupSize) {
  const response = await fetch(`${BACKEND_URL}/api/itinerary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination, days, groupSize })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get itinerary suggestion");
  }

  return data.suggestion;
}

// Streams the answer as it's generated. Calls onUpdate(fullTextSoFar) every
// time a new chunk arrives, so the caller can update the UI live (like a
// typing effect). Returns the final full text once the stream ends.
async function streamItinerarySuggestion(destination, days, groupSize, onUpdate) {
  const response = await fetch(`${BACKEND_URL}/api/itinerary/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ destination, days, groupSize })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || "Failed to get itinerary suggestion");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep the last, possibly incomplete line for next time

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) continue;

      try {
        const chunk = JSON.parse(jsonStr);
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (text) {
          fullText += text;
          onUpdate(fullText);
        }
      } catch (e) {
        // Incomplete JSON chunk mid-stream — safe to skip, next chunk completes it
      }
    }
  }

  return fullText;
}

// Turns Gemini's Markdown response into safe HTML.
// marked.parse() converts Markdown (headings, bullets, bold) into HTML.
// DOMPurify.sanitize() strips anything dangerous before it touches the page,
// since this text came from a network response, not from code we wrote.
function renderMarkdown(markdownText) {
  return DOMPurify.sanitize(marked.parse(markdownText));
}