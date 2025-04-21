async function loadWorksheetData() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    const response = await fetch(
      `/worksheets2025/api/fetch-records-worksheets?record=${recordId}`
    );
    const data = await response.json();
    const fields = data.fields;

    // Inject Title
    if (fields["Worksheet Title"]) {
      document.querySelector(".worksheet-main-title").textContent =
        fields["Worksheet Title"];
    }

    // Load Main Products Table
    const mainTable = document.querySelector(".worksheet-rows-main");
    if (fields["Main Products"]) {
      fields["Main Products"].forEach((productRow) => {
        const row = document.createElement("div");
        row.className = "worksheet-row worksheet-row-white"; // or blue/green based on Airtable "Row Highlight" field
        row.innerHTML = `
          <div class="worksheet-product">${productRow.Product}</div>
          <div class="worksheet-price">${productRow.Price}</div>
          <div class="worksheet-x">X</div>
          <div class="worksheet-equals">=</div>
        `;
        mainTable.appendChild(row);
      });
    }

    // Load Pallet Products Table
    const palletTable = document.querySelector(".worksheet-rows-pallet");
    if (fields["Pallet Offers"]) {
      fields["Pallet Offers"].forEach((palletRow) => {
        const row = document.createElement("div");
        row.className = "worksheet-row worksheet-row-white";
        row.innerHTML = `
          <div class="worksheet-product">${palletRow.Product}</div>
          <div class="worksheet-price">${palletRow.Price}</div>
          <div class="worksheet-x">X</div>
          <div class="worksheet-equals">=</div>
        `;
        palletTable.appendChild(row);
      });
    }

    // Inject Footnotes
    const footnoteList = document.querySelector(".worksheet-footnotes-list");
    if (fields["Footnotes"]) {
      footnoteList.innerHTML = fields["Footnotes"];
    }
  } catch (err) {
    console.error("Error fetching worksheet Airtable record:", err);
  }
}

// Run it
loadWorksheetData();
