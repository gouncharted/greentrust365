async function loadTable() {
  try {
    console.log("🔄 Loading table data...");

    const response = await fetch("/api/fetch-table-records");
    const data = await response.json();

    console.log("✅ Table data loaded:", data);

    const combined = [...data.mainProducts, ...data.palletOffers];

    // Alphabetically sort by Product field
    combined.sort((a, b) => {
      const nameA = (a.Product || "").toUpperCase();
      const nameB = (b.Product || "").toUpperCase();
      return nameA.localeCompare(nameB);
    });

    // Split into two halves
    const middleIndex = Math.ceil(combined.length / 2);
    const leftSide = combined.slice(0, middleIndex);
    const rightSide = combined.slice(middleIndex);

    // Populate both sides
    populateTable(leftSide, document.getElementById("left-products"));
    populateTable(rightSide, document.getElementById("right-products"));

    // Populate footnotes if any
    const footnoteList = document.querySelector(".worksheet-footnotes-list");
    if (footnoteList && data.footnotes?.length > 0) {
      footnoteList.innerHTML = data.footnotes
        .map((note) => `<div>${note}</div>`)
        .join("");
    }
  } catch (err) {
    console.error("❌ Error loading table:", err);
  }
}

function populateTable(items, container) {
  items.forEach((item) => {
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
      <div class="worksheet-price">${
        item.Price ? `$${item.Price.toFixed(2)}` : ""
      }</div>
      <div class="worksheet-x">X</div>
      <div class="worksheet-equals">=</div>
    `;

    container.appendChild(row);
  });
}

// START table load
loadTable();
