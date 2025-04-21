async function loadWorksheet() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    // Load the table.html first
    const tableHtml = await fetch(
      "/worksheets2025/golfandsportsturf/table.html"
    ).then((res) => res.text());

    document.getElementById("table-container").innerHTML = tableHtml;
    console.log("✅ Table structure loaded successfully");

    // Now that the table HTML is injected,
    // dynamically load table-script.js
    const tableScript = document.createElement("script");
    tableScript.src = "/worksheets2025/golfandsportsturf/table-script.js";
    tableScript.onload = () => {
      console.log("✅ Table script loaded successfully");
      loadTable(recordId); // <-- Now it's safe to call!
    };
    document.body.appendChild(tableScript);

    // Start the page worksheet data fetch
    await loadWorksheetData(recordId);
  } catch (err) {
    console.error("Error loading worksheet:", err);
  }
}

async function loadWorksheetData(recordId) {
  try {
    const response = await fetch(`/api/fetch-worksheet?record=${recordId}`);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch worksheet data. Status: ${response.status}`
      );
    }
    const data = await response.json();
    console.log("✅ Worksheet page data loaded:", data);

    if (data.pageFields?.Name) {
      const titleElement = document.querySelector(".worksheet-main-title");
      if (titleElement) titleElement.textContent = data.pageFields.Name;
      document.title = data.pageFields.Name;
    }
  } catch (err) {
    console.error("Error loading worksheet page data:", err);
  }
}

// Start the page load
loadWorksheet();
