async function loadTable() {
  try {
    console.log("🔄 Loading table data...");

    const response = await fetch("/api/fetch-table-records");
    const data = await response.json();

    console.log("✅ Table data loaded:", data);

    populateTable(data.records);
  } catch (err) {
    console.error("❌ Error loading table:", err);
  }
}

function populateTable(records) {
  const leftColumn = document.querySelector(".left-table .product-table");
  const rightColumn = document.querySelector(".right-table .product-table");

  if (!leftColumn || !rightColumn) {
    console.error("❌ Missing left/right columns!");
    return;
  }

  // Sort records alphabetically (just in case)
  records.sort((a, b) => {
    return (a.fields.Product || "").localeCompare(b.fields.Product || "");
  });

  const splitIndex = Math.ceil(records.length / 2);
  const leftRecords = records.slice(0, splitIndex);
  const rightRecords = records.slice(splitIndex);

  leftRecords.forEach((record) => {
    const row = createRow(record);
    leftColumn.appendChild(row);
  });

  rightRecords.forEach((record) => {
    const row = createRow(record);
    rightColumn.appendChild(row);
  });
}

function createRow(record) {
  const row = document.createElement("div");
  row.className = "worksheet-row";

  const productName = record.fields.Product || "";
  const price = record.fields.Price ? `$${record.fields.Price.toFixed(2)}` : "";
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

// Start the script!
loadTable();
