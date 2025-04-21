async function loadWorksheet() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    const tableHtml = await fetch(
      "/worksheets2025/golfandsportsturf/table.html"
    ).then((res) => res.text());
    document.getElementById("table-container").innerHTML = tableHtml;

    console.log("✅ Table loaded successfully");

    // Now call your real worksheet data load
    await loadWorksheetData(recordId);
  } catch (err) {
    console.error("Error loading worksheet or table:", err);
  }
}

async function loadWorksheetData(recordId) {
  console.log(
    "Temporary: Simulating loading worksheet data with recordId:",
    recordId
  );
  // Later this is where you will actually fetch the Airtable fields
}

loadWorksheet();
