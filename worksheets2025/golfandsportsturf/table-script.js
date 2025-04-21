async function loadTable() {
  try {
    console.log("⏳ Loading table data...");

    const response = await fetch(`/api/fetch-table-records`);

    if (!response.ok) {
      throw new Error(`Failed to fetch table records. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Table data loaded:", data);

    populateTables(data.records); // ⬅️ notice: 'records', not full object
  } catch (err) {
    console.error("❌ Error loading table:", err);
  }
}

function populateTables(records) {
  const mainTable = document.querySelector(".worksheet-rows-main");
  const palletTable = document.querySelector(".worksheet-rows-pallet");

  records.forEach((item) => {
    const section = item.fields.Section;
    const row = createProductRow(item.fields);

    if (section === "Product" && mainTable) {
      mainTable.appendChild(row);
    } else if (section === "Pallet Offer" && palletTable) {
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

  row.innerHTML = `
    <div class="worksheet-product">${item.Product || ""}</div>
    <div class="worksheet-price">$${item.Price?.toFixed(2) || ""}</div>
    <div class="worksheet-x">X</div>
    <div class="worksheet-equals">=</div>
  `;

  return row;
}

// Start it
loadTable();