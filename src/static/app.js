document.addEventListener("DOMContentLoaded", () => {
  // Add a visible banner to confirm JS is running
  const banner = document.createElement('div');
  banner.textContent = 'JavaScript is running (app.js loaded)';
  banner.style.background = '#dff0d8';
  banner.style.color = '#2e7d32';
  banner.style.textAlign = 'center';
  banner.style.fontWeight = 'bold';
  banner.style.padding = '8px';
  banner.style.borderBottom = '2px solid #2e7d32';
  document.body.insertBefore(banner, document.body.firstChild);
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const submitButton = signupForm.querySelector('button[type="submit"]');

  // Function to fetch activities from API
  async function fetchActivities() {
    console.log('[fetchActivities] called');
    activitiesList.innerHTML = '<p style="color:#888">Loading activities...</p>';
    let domChanged = false;
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <p><strong>Participants:</strong></p>
          <ul>
            ${details.participants.map(participant => `<li><span>${participant}</span><button class=\"delete-participant\" data-activity=\"${name}\" data-email=\"${participant}\" title=\"Remove participant\">🗑️</button></li>`).join('')}
          </ul>
        `;

        activitiesList.appendChild(activityCard);
        domChanged = true;

        // Add event listeners for delete buttons inside this card
        const deleteButtons = activityCard.querySelectorAll('.delete-participant');
        deleteButtons.forEach(button => {
          button.addEventListener('click', async (event) => {
            event.preventDefault();
            const activity = button.getAttribute('data-activity');
            const email = button.getAttribute('data-email');
            await deleteParticipant(activity, email);
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      if (!domChanged) {
        alert('fetchActivities ran but did not update the DOM!');
      }
      console.log('[fetchActivities] DOM updated');
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to delete a participant
  async function deleteParticipant(activity, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        // Refresh activities list
        await fetchActivities();
      } else {
        const detail = result.detail || result.message || JSON.stringify(result) || 'An error occurred';
        messageDiv.textContent = `Error (${response.status}): ${detail}`;
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    // disable submit to prevent duplicate requests
    if (submitButton) {
      submitButton.disabled = true;
      const origText = submitButton.textContent;
      submitButton.textContent = 'Signing up...';
      submitButton.setAttribute('data-orig-text', origText);
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      console.log('Signup response status:', response.status, result);

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        console.log('Signup successful for', email, '->', activity);
        // Force refresh activities from server
        try {
          console.log('Forcing activities refresh after signup...');
          await fetchActivities();
          console.log('Activities refreshed (forced)');
        } catch (err) {
          console.error('Failed to refresh activities after signup', err);
        }
      } else {
        // show server-provided error detail (e.g. already signed up)
        const detail = result.detail || result.message || JSON.stringify(result) || 'An error occurred';
        messageDiv.textContent = `Error (${response.status}): ${detail}`;
        messageDiv.className = "error";
        console.warn('Signup failed:', response.status, result);
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        const orig = submitButton.getAttribute('data-orig-text');
        if (orig) submitButton.textContent = orig;
      }
    }
  });

  // Initialize app
  fetchActivities();
});
