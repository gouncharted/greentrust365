async function loadTableData() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const recordId = urlParams.get("record");

    const response = await fetch(`/api/fetch-table-records?record=${recordId}`);
    if (!response.ok)
      throw new Error(`Failed to fetch table data. Status: ${response.status}`);

    const data = await response.json();
    console.log("✅ Table data loaded:", data);

    populateTable(data.records);
  } catch (err) {
    console.error("❌ Error loading table data:", err);
  }
}

function populateTable(records) {
  if (!Array.isArray(records)) {
    console.error("Table records not an array:", records);
    return;
  }

  const leftTable = document.getElementById("left-products");
  const rightTable = document.getElementById("right-products");

  if (!leftTable || !rightTable) {
    console.error("Missing left or right table elements!");
    return;
  }

  // Split records by Section
  const mainProducts = records.filter((r) => r.fields.Section === "Product");
  const palletOffers = records.filter(
    (r) => r.fields.Section === "Pallet Offer"
  );

  mainProducts.forEach((item) => {
    const row = createRow(item);
    leftTable.appendChild(row);
  });

  palletOffers.forEach((item) => {
    const row = createRow(item);
    rightTable.appendChild(row);
  });
}

function createRow(item) {
  const row = document.createElement("div");
  row.className = "worksheet-row";

  const product = item.fields.Product || "";
  const price = item.fields.Price ? `$${item.fields.Price.toFixed(2)}` : "";

  row.innerHTML = `
    <div class="worksheet-product">${product}</div>
    <div class="worksheet-price">${price}</div>
    <div class="worksheet-x">X</div>
    <div class="worksheet-equals">=</div>
  `;

  return row;
}

// Load everything on page load
loadTableData();
