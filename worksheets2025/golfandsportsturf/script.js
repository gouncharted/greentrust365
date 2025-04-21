async function loadWorksheet() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    // Load the table layout HTML
    const tableHtml = await fetch(
      "/worksheets2025/golfandsportsturf/table.html"
    ).then((res) => res.text());
    document.getElementById("table-container").innerHTML = tableHtml;

    console.log("✅ Table structure loaded successfully");

    // 🛠 MANUALLY call loadTable() to fetch table records
    await loadTable();

    // Now load page-level worksheet data (program year, title)
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

    // Update title
    if (data.pageFields?.Name) {
      document.title = data.pageFields.Name;
      const titleElement = document.querySelector(".worksheet-main-title");
      if (titleElement) titleElement.textContent = data.pageFields.Name;
    }

    // (If you later want to use Program Year, you can insert it here too)
  } catch (err) {
    console.error("Error loading worksheet page data:", err);
  }
}

// Start the page load
loadWorksheet();
