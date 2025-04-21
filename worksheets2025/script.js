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

    // After loading table, fetch and populate worksheet
    loadWorksheetData(recordId);
  } catch (err) {
    console.error("Error loading worksheet:", err);
  }
}

loadWorksheet();
