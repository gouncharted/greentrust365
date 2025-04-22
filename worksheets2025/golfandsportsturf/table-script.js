async function loadTable() {
  try {
    console.log("🔄 Loading table data...");

    const response = await fetch("/api/fetch-table-records");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch table records. Status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Table data loaded:", data);

    populateTable(data.records);
  } catch (err) {
    console.error("❌ Error loading table:", err);
  }
}

function populateTable(records) {
  const leftTable = document.getElementById("left-products");
  const rightTable = document.getElementById("right-products");

  if (!leftTable || !rightTable) {
    console.error("❌ Left or right table container not found.");
    return;
  }

  // Split roughly in half
  const halfway = Math.ceil(records.length / 2);
  const leftRecords = records.slice(0, halfway);
  const rightRecords = records.slice(halfway);

  leftRecords.forEach((record) => {
    const row = createRow(record);
    leftTable.appendChild(row);
  });

  rightRecords.forEach((record) => {
    const row = createRow(record);
    rightTable.appendChild(row);
  });
}

function createRow(record) {
  const row = document.createElement("div");
  row.className = "worksheet-row";

  const productName = record.fields.Product || "";
  const price = record.fields.Price ? record.fields.Price.toFixed(2) : "";
  const x = "X";
  const equals = "=";

  if (record.fields["Row Highlight"] === "Blue Highlight") {
    row.classList.add("worksheet-row-light-blue");
  } else if (record.fields["Row Highlight"] === "Green Highlight") {
    row.classList.add("worksheet-row-light-green");
  }

  row.innerHTML = `
    <div>${productName}</div>
    <div class="small-cell">$</div>
    <div class="small-cell price-cell">${price}</div>
    <div class="small-cell">${x}</div>
    <div class="small-cell"></div>
    <div class="small-cell">${equals}</div>
    <div class="small-cell"></div>
  `;

  return row;
}

// Start loading on page load
loadTable();
