// ==========================================================================
// TripSync — Real-time group chat
// Reuses `groupCode` and `escapeHtml` from group.js (loaded before this
// file, same global scope).
// ==========================================================================

const currentMemberName = localStorage.getItem(`tripsync_name_${groupCode}`) || "Someone";

const chatMessagesEl = document.getElementById("chat-messages");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

if (groupCode && chatMessagesEl) {
  // limitToLast keeps this cheap even if a trip chat gets long
  db.ref(`groups/${groupCode}/messages`).limitToLast(200).on("value", (snapshot) => {
    const messages = snapshot.val() || {};
    renderMessages(messages);
  });
}

function renderMessages(messages) {
  const sorted = Object.values(messages).sort((a, b) => (a.sentAt || 0) - (b.sentAt || 0));

  chatMessagesEl.innerHTML = "";

  if (sorted.length === 0) {
    chatMessagesEl.innerHTML = `<p class="empty-note">No messages yet — say hi!</p>`;
    return;
  }

  sorted.forEach((msg) => {
    const isMe = msg.senderId === currentMemberId;
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${isMe ? "me" : ""}`;
    bubble.innerHTML = `
      <span class="chat-sender">${escapeHtml(msg.senderName)}</span>
      <span class="chat-text">${escapeHtml(msg.text)}</span>
    `;
    chatMessagesEl.appendChild(bubble);
  });

  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

if (chatForm) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = "";

    try {
      await db.ref(`groups/${groupCode}/messages`).push({
        senderId: currentMemberId,
        senderName: currentMemberName,
        text: text,
        sentAt: firebase.database.ServerValue.TIMESTAMP
      });
    } catch (err) {
      console.error(err);
    }
  });
}