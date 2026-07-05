// ==========================================================================
// TripSync — AI itinerary UI
// Wires the functions in js/gemini.js (streamItinerarySuggestion, renderMarkdown)
// to the actual form + output box in group.html.
// ==========================================================================

const itineraryForm = document.getElementById("itinerary-form");
const itineraryOutput = document.getElementById("itinerary-output");
const itineraryError = document.getElementById("itinerary-error");
const itineraryBtn = document.getElementById("itinerary-submit");

if (itineraryForm) {
  itineraryForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    itineraryError.textContent = "";
    itineraryOutput.innerHTML = "";

    const destination = document.getElementById("itinerary-destination").value.trim();
    const days = parseInt(document.getElementById("itinerary-days").value, 10) || 3;
    const groupSize = parseInt(document.getElementById("itinerary-groupsize").value, 10) || 4;

    if (!destination) {
      itineraryError.textContent = "Enter a destination first.";
      return;
    }

    itineraryBtn.disabled = true;
    itineraryBtn.textContent = "Thinking…";
    itineraryOutput.innerHTML = `<span class="caret"></span>`;

    let fullText = "";

    try {
      await streamItinerarySuggestion(destination, days, groupSize, (textSoFar) => {
        fullText = textSoFar;
        itineraryOutput.innerHTML = renderMarkdown(fullText) + '<span class="caret"></span>';
      });
      itineraryOutput.innerHTML = renderMarkdown(fullText);
    } catch (err) {
      console.error(err);
      itineraryError.textContent = "Couldn't reach the AI backend — make sure your server is running (npm run dev inside /server).";
      itineraryOutput.innerHTML = "";
    } finally {
      itineraryBtn.disabled = false;
      itineraryBtn.textContent = "Get AI itinerary";
    }
  });
}