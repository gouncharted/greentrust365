async function loadWorksheet() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    const response = await fetch(`/api/fetch-worksheet?record=${recordId}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch worksheet page. Status: ${response.status}`
      );
    }

    const data = await response.json();

    if (data.pageFields?.Name) {
      document.title = data.pageFields.Name;
      const titleElement = document.querySelector(".worksheet-main-title");
      if (titleElement) titleElement.textContent = data.pageFields.Name;
    }

    if (data.pageFields?.["Program Year"]) {
      const yearElements = document.querySelectorAll(".program-year");
      yearElements.forEach(
        (el) => (el.textContent = data.pageFields["Program Year"])
      );
    }
  } catch (err) {
    console.error("Error loading worksheet page:", err);
  }
}

loadWorksheet();
