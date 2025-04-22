async function loadTableData() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    const response = await fetch(`/api/fetch-table-records?record=${recordId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch table data. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Table data loaded:", data);

    const leftTable = document.getElementById("left-products");
    const rightTable = document.getElementById("right-products");

    const allRows = [...data.mainProducts, ...data.palletOffers];

    allRows.forEach((item, index) => {
      const row = createTableRow(item);

      if (index % 2 === 0) {
        leftTable.appendChild(row);
      } else {
        rightTable.appendChild(row);
      }
    });

    // Footnotes
    if (data.footnotes?.length > 0) {
      const footnoteList = document.querySelector(".worksheet-footnotes-list");
      footnoteList.innerHTML = data.footnotes
        .map((note) => `<div>${note}</div>`)
        .join("");
    }
  } catch (err) {
    console.error("Error loading table data:", err);
  }
}

function createTableRow(item) {
  const row = document.createElement("div");
  row.className = "worksheet-row";

  if (item["Row Highlight"] === "Blue Highlight") {
    row.classList.add("worksheet-row-light-blue");
  } else if (item["Row Highlight"] === "Green Highlight") {
    row.classList.add("worksheet-row-light-green");
  } else {
    row.classList.add("worksheet-row-white");
  }

  // Auto format price without extra dollar sign if already clean
  const price = item.Price ? `$${parseFloat(item.Price).toFixed(2)}` : "";

  row.innerHTML = `
    <div class="worksheet-product">${item.Product || ""}</div>
    <div class="worksheet-price">${price}</div>
    <div class="worksheet-x">X</div>
    <div class="worksheet-price"></div>
    <div class="worksheet-equals">=</div>
    <div class="worksheet-price"></div>
  `;

  return row;
}

// 🚀 Start loading once the table.html is inserted
loadTableData();
