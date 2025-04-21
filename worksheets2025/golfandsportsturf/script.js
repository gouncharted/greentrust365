async function loadWorksheet() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("❌ No record ID found in URL.");
    return;
  }

  try {
    // 1. Load worksheet page info (title, etc.)
    await loadWorksheetPage(recordId);

    // 2. Load table HTML structure
    await loadTableStructure();

    // 3. Load table data AFTER structure is inserted
    await loadTableData();
  } catch (err) {
    console.error("❌ Error during worksheet loading:", err);
  }
}

async function loadWorksheetPage(recordId) {
  try {
    const response = await fetch(`/api/fetch-worksheet?record=${recordId}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch worksheet page data. Status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Worksheet page loaded:", data);

    if (data.pageFields?.Name) {
      document.title = data.pageFields.Name;
      const titleElement = document.querySelector(".worksheet-main-title");
      if (titleElement) {
        titleElement.textContent = data.pageFields.Name;
      }
    }
  } catch (err) {
    console.error("❌ Error loading worksheet page:", err);
    throw err;
  }
}

async function loadTableStructure() {
  try {
    const tableHtml = await fetch(
      "/worksheets2025/golfandsportsturf/table.html"
    ).then((res) => res.text());
    document.getElementById("table-container").innerHTML = tableHtml;
    console.log("✅ Table structure loaded.");

    // After table HTML is injected, load table-script.js dynamically
    const script = document.createElement("script");
    script.src = "/worksheets2025/golfandsportsturf/table-script.js";
    document.body.appendChild(script);
  } catch (err) {
    console.error("❌ Error loading table structure:", err);
    throw err;
  }
}

async function loadTableData() {
  try {
    const response = await fetch("/api/fetch-table-records");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch table records. Status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Table data loaded:", data);

    populateTables(data);
  } catch (err) {
    console.error("❌ Error loading table data:", err);
    throw err;
  }
}

// Start the full worksheet loading sequence
loadWorksheet();
