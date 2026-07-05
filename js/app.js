// ==========================================================================
// TripSync — Landing page logic
// Handles: creating a new group (generates join code) and joining an
// existing group by code. Both redirect to group.html on success.
// ==========================================================================

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function generateJoinCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

function slugifyMemberName(name) {
  // Firebase keys can't contain ".", "#", "$", "/", "[", "]" — strip them
  return name.trim().replace(/[.#$\[\]/]/g, "");
}

// --- CREATE GROUP ------------------------------------------------------

const createForm = document.getElementById("create-form");
const createError = document.getElementById("create-error");
const createStatus = document.getElementById("create-status");

createForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  createError.textContent = "";
  createStatus.textContent = "";

  const tripName = document.getElementById("trip-name").value.trim();
  const yourName = document.getElementById("create-your-name").value.trim();

  if (!tripName || !yourName) {
    createError.textContent = "Please fill in both fields.";
    return;
  }

  const submitBtn = createForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  createStatus.textContent = "Creating your group…";

  try {
    // Generate a code that isn't already taken (retry a couple times just in case)
    let code = generateJoinCode();
    let attempts = 0;
    while (attempts < 5) {
      const existing = await db.ref(`groups/${code}`).get();
      if (!existing.exists()) break;
      code = generateJoinCode();
      attempts++;
    }

    const memberId = slugifyMemberName(yourName) + "-" + Date.now();

    await db.ref(`groups/${code}`).set({
      tripName: tripName,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
      members: {
        [memberId]: {
          name: yourName,
          joinedAt: firebase.database.ServerValue.TIMESTAMP
        }
      }
    });

    // Remember who "you" are on this device for this group
    localStorage.setItem(`tripsync_member_${code}`, memberId);
    localStorage.setItem(`tripsync_name_${code}`, yourName);

    createStatus.textContent = "Group created! Redirecting…";
    window.location.href = `group.html?code=${code}`;
  } catch (err) {
    console.error(err);
    createError.textContent = "Something went wrong creating the group. Check your Firebase setup in js/firebase-config.js.";
    submitBtn.disabled = false;
    createStatus.textContent = "";
  }
});

// --- JOIN GROUP ----------------------------------------------------------

const joinForm = document.getElementById("join-form");
const joinError = document.getElementById("join-error");
const joinStatus = document.getElementById("join-status");

joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  joinError.textContent = "";
  joinStatus.textContent = "";

  const code = document.getElementById("join-code").value.trim().toUpperCase();
  const yourName = document.getElementById("join-your-name").value.trim();

  if (!code || !yourName) {
    joinError.textContent = "Please fill in both fields.";
    return;
  }

  const submitBtn = joinForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  joinStatus.textContent = "Checking code…";

  try {
    const snapshot = await db.ref(`groups/${code}`).get();

    if (!snapshot.exists()) {
      joinError.textContent = "That code doesn't match any group. Double-check it with whoever sent it.";
      submitBtn.disabled = false;
      joinStatus.textContent = "";
      return;
    }

    const memberId = slugifyMemberName(yourName) + "-" + Date.now();

    await db.ref(`groups/${code}/members/${memberId}`).set({
      name: yourName,
      joinedAt: firebase.database.ServerValue.TIMESTAMP
    });

    localStorage.setItem(`tripsync_member_${code}`, memberId);
    localStorage.setItem(`tripsync_name_${code}`, yourName);

    joinStatus.textContent = "Joined! Redirecting…";
    window.location.href = `group.html?code=${code}`;
  } catch (err) {
    console.error(err);
    joinError.textContent = "Something went wrong joining the group. Check your Firebase setup in js/firebase-config.js.";
    submitBtn.disabled = false;
    joinStatus.textContent = "";
  }
});