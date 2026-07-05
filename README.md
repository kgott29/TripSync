# TripSync

**One link, one trip.** Stop juggling five apps to plan a group trip — TripSync puts destination voting, live weather, group chat, and AI-generated itineraries in one place.

🔗 **Live app:** https://tripsync-1-32hl.onrender.com

---

## The problem

Planning a group trip means bouncing between a WhatsApp group for chat, a spreadsheet for costs, a separate tab for weather, and a scattered mess of opinions on where to actually go. TripSync collapses all of that into a single shared space, joined with one code.

## Features

- **Instant group creation** — create a trip, get a 6-character join code, share it. No sign-up required to join.
- **Destination poll with live weather** — suggest places, vote, and see real-time weather for each option side by side.
- **Real-time group chat** — built on Firebase, updates instantly across everyone in the group.
- **AI itinerary suggestions** — powered by Gemini, streamed in live (word-by-word) with proper Markdown formatting, once a destination is picked.
- **Boarding-pass visual identity** — ticket-style cards with notched edges, a flight-path background, dark travel-poster theme.

Photo gallery is  left for a future pass.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Plain HTML / CSS / JS — no framework, no build step |
| Database | Firebase Realtime Database |
| Backend | Node.js + Express — keeps the Gemini API key off the client |
| Weather | OpenWeatherMap |
| AI | Google Gemini (streaming) |
| Hosting | Render (both frontend and backend) |

## Project structure

```
TripSync/
├── index.html          
├── group.html           
├── css/style.css
├── js/                   
├── server/                

---
## APIs used

| API | What it's used for | Free tier |
|---|---|---|
| [Firebase Realtime Database](https://firebase.google.com/docs/database) | Group data, live poll/vote sync, real-time chat | Yes, no card required |
| [OpenWeatherMap](https://openweathermap.org/api) | Live weather shown per destination option in the poll | Yes, no card required |
| [Google Gemini API](https://ai.google.dev/) | Streamed, Markdown-formatted AI itinerary suggestions | Yes, no card required |

Note: the Gemini key is kept server-side (in the `server/` backend) and never exposed to the browser. The OpenWeatherMap key is used client-side — its free tier is low-risk to expose (rate-limited, not billable).
