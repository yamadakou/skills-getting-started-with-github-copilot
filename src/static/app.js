document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const signupButton = signupForm.querySelector('button[type="submit"]');
  let messageTimeoutId;

  function setSignupPending(isPending) {
    signupButton.disabled = isPending;
    signupButton.textContent = isPending ? "Signing Up..." : "Sign Up";
  }

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    window.clearTimeout(messageTimeoutId);
    messageTimeoutId = window.setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  async function removeParticipant(activityName, participantEmail) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(participantEmail)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to remove participant. Please try again.", "error");
      console.error("Error removing participant:", error);
    }
  }

  function createActivityCard(name, details) {
    const activityCard = document.createElement("article");
    activityCard.className = "activity-card";

    const spotsLeft = details.max_participants - details.participants.length;

    const header = document.createElement("div");
    header.className = "activity-card-header";

    const title = document.createElement("h4");
    title.textContent = name;

    const badge = document.createElement("span");
    badge.className = "activity-badge";
    badge.textContent = `${details.participants.length}/${details.max_participants} joined`;

    header.append(title, badge);

    const description = document.createElement("p");
    description.className = "activity-description";
    description.textContent = details.description;

    const meta = document.createElement("div");
    meta.className = "activity-meta";

    const schedule = document.createElement("p");
    schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

    const availability = document.createElement("p");
    availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

    meta.append(schedule, availability);

    const participantsSection = document.createElement("div");
    participantsSection.className = "participants-section";

    const participantsHeading = document.createElement("div");
    participantsHeading.className = "participants-heading";

    const participantsTitle = document.createElement("p");
    participantsTitle.className = "participants-title";
    participantsTitle.textContent = "Participants";

    const participantsCount = document.createElement("span");
    participantsCount.className = "participants-count";
    participantsCount.textContent = `${details.participants.length} student${details.participants.length === 1 ? "" : "s"}`;

    participantsHeading.append(participantsTitle, participantsCount);
    participantsSection.appendChild(participantsHeading);

    if (details.participants.length) {
      const participantsList = document.createElement("ul");
      participantsList.className = "participants-list";

      details.participants.forEach((participant) => {
        const participantItem = document.createElement("li");
        participantItem.className = "participant-item";

        const participantEmail = document.createElement("span");
        participantEmail.className = "participant-email";
        participantEmail.textContent = participant;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "participant-remove";
        removeButton.setAttribute("aria-label", `Remove ${participant} from ${name}`);

        const removeIcon = document.createElement("span");
        removeIcon.className = "participant-remove-icon";
        removeIcon.setAttribute("aria-hidden", "true");

        removeButton.appendChild(removeIcon);
        removeButton.addEventListener("click", () => {
          removeParticipant(name, participant);
        });

        participantItem.append(participantEmail, removeButton);
        participantsList.appendChild(participantItem);
      });

      participantsSection.appendChild(participantsList);
    } else {
      const emptyState = document.createElement("p");
      emptyState.className = "participants-empty";
      emptyState.textContent = "No participants yet";
      participantsSection.appendChild(emptyState);
    }

    activityCard.append(header, description, meta, participantsSection);
    return activityCard;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = createActivityCard(name, details);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      setSignupPending(true);
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        signupForm.reset();
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    } finally {
      setSignupPending(false);
    }
  });

  // Initialize app
  fetchActivities();
});
