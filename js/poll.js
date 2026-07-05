// ==========================================================================
// TripSync — Destination poll logic
// Anyone in the group can suggest a place, anyone can vote (toggle) for any
// option, and each option shows live weather. Reuses `groupCode` and
// `escapeHtml` from group.js (loaded before this file, same global scope).
// ==========================================================================

// Reuses `groupCode`, `currentMemberId`, and `escapeHtml` from group.js
// (loaded before this file, same global scope).
const pollOptionsList = document.getElementById("poll-options");
const addOptionForm = document.getElementById("add-option-form");
const addOptionError = document.getElementById("add-option-error");

const weatherCache = {}; // place name -> weather data, avoids re-fetching on every vote update

if (addOptionForm) {
  addOptionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    addOptionError.textContent = "";

    const placeInput = document.getElementById("option-place");
    const place = placeInput.value.trim();
    if (!place) return;

    try {
      await db.ref(`groups/${groupCode}/poll/options`).push({
        place: place,
        votes: {}
      });
      placeInput.value = "";
    } catch (err) {
      console.error(err);
      addOptionError.textContent = "Couldn't add that option — try again.";
    }
  });
}

if (groupCode && pollOptionsList) {
  db.ref(`groups/${groupCode}/poll/options`).on("value", (snapshot) => {
    const options = snapshot.val() || {};
    renderPollOptions(options);
  });
}

function renderPollOptions(options) {
  pollOptionsList.innerHTML = "";
  const entries = Object.entries(options);

  if (entries.length === 0) {
    pollOptionsList.innerHTML = `<p class="empty-note">No destinations suggested yet — add the first one above.</p>`;
    return;
  }

  // Highest votes first
  entries.sort((a, b) => {
    const votesA = Object.keys(a[1].votes || {}).length;
    const votesB = Object.keys(b[1].votes || {}).length;
    return votesB - votesA;
  });

  entries.forEach(([optionId, option]) => {
    const votes = option.votes || {};
    const voteCount = Object.keys(votes).length;
    const hasVoted = currentMemberId && votes[currentMemberId];

    const card = document.createElement("div");
    card.className = "poll-option";
    card.innerHTML = `
      <div class="poll-option-main">
        <span class="poll-place">${escapeHtml(option.place)}</span>
        <span class="poll-weather" id="weather-${optionId}">Checking weather…</span>
      </div>
      <div class="poll-option-actions">
        <span class="poll-votes">${voteCount} vote${voteCount === 1 ? "" : "s"}</span>
        <button class="btn-vote ${hasVoted ? "voted" : ""}" data-option-id="${optionId}">
          ${hasVoted ? "Voted ✓" : "Vote"}
        </button>
      </div>
    `;
    pollOptionsList.appendChild(card);
    loadWeatherFor(option.place, optionId);
  });

  pollOptionsList.querySelectorAll(".btn-vote").forEach((btn) => {
    btn.addEventListener("click", () => toggleVote(btn.dataset.optionId));
  });
}

async function loadWeatherFor(place, optionId) {
  const weatherEl = document.getElementById(`weather-${optionId}`);
  if (!weatherEl) return;

  if (weatherCache[place]) {
    weatherEl.textContent = formatWeather(weatherCache[place]);
    return;
  }

  try {
    const weather = await getWeather(place);
    weatherCache[place] = weather;
    const stillThere = document.getElementById(`weather-${optionId}`);
    if (stillThere) stillThere.textContent = formatWeather(weather);
  } catch (err) {
    console.error(err);
    const stillThere = document.getElementById(`weather-${optionId}`);
    if (stillThere) stillThere.textContent = "Weather unavailable";
  }
}

function formatWeather(weather) {
  return `${weather.tempC}°C, ${weather.description}`;
}

async function toggleVote(optionId) {
  if (!currentMemberId) return;
  const voteRef = db.ref(`groups/${groupCode}/poll/options/${optionId}/votes/${currentMemberId}`);
  const snapshot = await voteRef.get();
  if (snapshot.exists()) {
    await voteRef.remove();
  } else {
    await voteRef.set(true);
  }
}