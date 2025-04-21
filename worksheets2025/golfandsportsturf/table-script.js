function populateTables(data) {
  if (!data || !Array.isArray(data.records)) {
    console.error("❌ No valid data to populate tables.");
    return;
  }

  const mainTable = document.querySelector(".worksheet-rows-main");
  const palletTable = document.querySelector(".worksheet-rows-pallet");

  if (!mainTable || !palletTable) {
    console.error("❌ Table containers not found.");
    return;
  }

  data.records.forEach((item) => {
    if (!item.fields) return;

    const row = createProductRow(item.fields);

    if (item.fields.Section === "Product") {
      mainTable.appendChild(row);
    } else if (item.fields.Section === "Pallet Offer") {
      palletTable.appendChild(row);
    }
  });

  console.log("✅ Tables populated successfully.");
}

function createProductRow(fields) {
  const row = document.createElement("div");
  row.className = "worksheet-row";

  // Apply background color based on Row Highlight
  if (fields["Row Highlight"] === "Green Highlight") {
    row.classList.add("worksheet-row-light-green");
  } else if (fields["Row Highlight"] === "Blue Highlight") {
    row.classList.add("worksheet-row-light-blue");
  } else {
    row.classList.add("worksheet-row-white");
  }

  row.innerHTML = `
    <div class="worksheet-product">${fields.Product || ""}</div>
    <div class="worksheet-price">$${
      fields.Price ? fields.Price.toFixed(2) : ""
    }</div>
    <div class="worksheet-x">X</div>
    <div class="worksheet-equals">=</div>
  `;

  return row;
}
