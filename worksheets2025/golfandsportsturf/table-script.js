async function loadTableData() {
  try {
    const response = await fetch(`/api/fetch-table-records`);
    if (!response.ok) {
      throw new Error(`Failed to fetch table data. Status: ${response.status}`);
    }
    const data = await response.json();
    console.log("✅ Table data loaded: ", data);

    populateTable(data.records);
  } catch (err) {
    console.error("❌ Error loading table data:", err);
  }
}

function populateTable(records) {
  const tableContainer = document.getElementById("worksheet-tables");

  records.forEach((item) => {
    const fields = item.fields || {};
    const section = fields.Section || "";
    const highlight = fields["Row Highlight"] || "";
    const priceRaw = fields["Pkg Price"] || "";
    const productName = fields["Product"] || "";

    const row = document.createElement("div");
    row.classList.add("worksheet-row");
    if (highlight === "Blue Highlight") {
      row.classList.add("worksheet-row-light-blue");
    } else if (highlight === "Green Highlight") {
      row.classList.add("worksheet-row-light-green");
    }

    row.innerHTML = `
      <div class="product-header">${productName}</div>
      <div></div> <!-- Spacer -->
      <div class="dollar-sign">$</div>
      <div class="price">${parseFloat(priceRaw).toFixed(2)}</div>
      <div class="x-symbol">X</div>
      <div class="equals-symbol">=</div>
      <div class="blank-field"></div>
    `;

    tableContainer.appendChild(row);
  });
}

loadTableData();
