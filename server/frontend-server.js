// ==========================================================================
// TripSync — Static file server (ONLY needed if deploying the frontend as
// a Render "Web Service" instead of a "Static Site". A Static Site is
// simpler and doesn't sleep on the free tier — this file is here only if
// you specifically want the Web Service route instead.
// ==========================================================================

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve every file in this folder (index.html, css/, js/) as-is
app.use(express.static(__dirname));

app.listen(PORT, () => {
  console.log(`TripSync frontend running at http://localhost:${PORT}`);
});