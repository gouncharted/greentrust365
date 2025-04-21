async function loadTable() {
  try {
    const response = await fetch("/api/fetch-table-records");

    if (!response.ok) {
      throw new Error(`Failed to fetch table data. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Table data loaded:", data);

    populateTables(data);
  } catch (err) {
    console.error("Error loading table:", err);
  }
}

function populateTables(data) {
  const mainTable = document.querySelector(".worksheet-rows-main");
  const palletTable = document.querySelector(".worksheet-rows-pallet");

  if (!mainTable || !palletTable) {
    console.error("Missing table containers on the page.");
    return;
  }

  data.forEach((item) => {
    const row = createProductRow(item);

    if (item.Section === "Product") {
      mainTable.appendChild(row);
    } else if (item.Section === "Pallet Offer") {
      palletTable.appendChild(row);
    }
  });
}

function createProductRow(item) {
  const row = document.createElement("div");
  row.className = "worksheet-row";

  if (item["Row Highlight"] === "Blue Highlight") {
    row.classList.add("worksheet-row-light-blue");
  } else if (item["Row Highlight"] === "Green Highlight") {
    row.classList.add("worksheet-row-light-green");
  } else {
    row.classList.add("worksheet-row-white");
  }

  const price =
    item.Price !== undefined ? `$${parseFloat(item.Price).toFixed(2)}` : "";

  row.innerHTML = `
    <div class="worksheet-product">${item.Product || ""}</div>
    <div class="worksheet-price">${price}</div>
    <div class="worksheet-x">X</div>
    <div class="worksheet-equals">=</div>
  `;

  return row;
}

// 🚀 Start the loading when page is ready
loadTable();
