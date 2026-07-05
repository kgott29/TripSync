// ==========================================================================
// TripSync — Group dashboard logic
// Reads the ?code= from the URL, loads the group's data, and keeps the
// trip name / member list live-updated via Firebase's realtime listeners.
// ==========================================================================

const params = new URLSearchParams(window.location.search);
const groupCode = (params.get("code") || "").toUpperCase();
const currentMemberId = groupCode ? localStorage.getItem(`tripsync_member_${groupCode}`) : null;

const tripNameDisplay = document.getElementById("trip-name-display");
const codeDisplay = document.getElementById("code-display");
const membersList = document.getElementById("members-list");

if (!groupCode) {
  // No code in URL — bounce back to landing page
  window.location.href = "index.html";
} else {
  codeDisplay.textContent = groupCode;

  // Live listener on the whole group node — keeps trip name + members in sync
  // for everyone in the group without needing to refresh the page.
  db.ref(`groups/${groupCode}`).on("value", (snapshot) => {
    const data = snapshot.val();

    if (!data) {
      tripNameDisplay.textContent = "Group not found";
      return;
    }

    tripNameDisplay.textContent = data.tripName || "Untitled trip";
    renderMembers(data.members || {});
  });
}

function renderMembers(members) {
  membersList.innerHTML = "";
  Object.values(members).forEach((member) => {
    const chip = document.createElement("div");
    chip.className = "member-chip";
    chip.innerHTML = `<span class="avatar-dot"></span>${escapeHtml(member.name)}`;
    membersList.appendChild(chip);
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Click-to-copy the join code
codeDisplay.addEventListener("click", () => {
  navigator.clipboard.writeText(groupCode).then(() => {
    const original = codeDisplay.textContent;
    codeDisplay.textContent = "Copied!";
    setTimeout(() => { codeDisplay.textContent = original; }, 1000);
  });
});