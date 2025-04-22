async function loadTable() {
  try {
    console.log("🔄 Loading table data...");

    const response = await fetch("/api/fetch-table-records");
    const data = await response.json();

    console.log("✅ Table data loaded:", data);

    const combined = data.records; // <-- HERE! Use records, not mainProducts/palletOffers

    // Alphabetically sort by Product field
    combined.sort((a, b) => {
      const nameA = (a.fields.Product || "").toUpperCase();
      const nameB = (b.fields.Product || "").toUpperCase();
      return nameA.localeCompare(nameB);
    });

    // Split into two halves
    const middleIndex = Math.ceil(combined.length / 2);
    const leftSide = combined.slice(0, middleIndex);
    const rightSide = combined.slice(middleIndex);

    // Populate both sides
    populateTable(leftSide, document.getElementById("left-products"));
    populateTable(rightSide, document.getElementById("right-products"));
  } catch (err) {
    console.error("❌ Error loading table:", err);
  }
}

function populateTable(items, container) {
  items.forEach((item) => {
    const fields = item.fields;

    const row = document.createElement("div");
    row.className = "worksheet-row";

    if (fields["Row Highlight"] === "Blue Highlight") {
      row.classList.add("worksheet-row-light-blue");
    } else if (fields["Row Highlight"] === "Green Highlight") {
      row.classList.add("worksheet-row-light-green");
    } else {
      row.classList.add("worksheet-row-white");
    }

    row.innerHTML = `
      <div class="worksheet-product">${fields.Product || ""}</div>
      <div class="worksheet-price">${
        fields.Price ? `$${fields.Price.toFixed(2)}` : ""
      }</div>
      <div class="worksheet-x">X</div>
      <div class="worksheet-equals">=</div>
    `;

    container.appendChild(row);
  });
}

// START table load
loadTable();
