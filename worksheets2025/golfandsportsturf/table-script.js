async function loadTable() {
  try {
    const tableHtml = await fetch(
      "/worksheets2025/golfandsportsturf/table.html"
    ).then((res) => res.text());
    document.getElementById("table-container").innerHTML = tableHtml;
    console.log("✅ Table structure loaded");

    const response = await fetch("/api/fetch-table-records");

    if (!response.ok) {
      throw new Error(
        `Failed to fetch table records. Status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Table data loaded:", data);

    const mainTable = document.querySelector(".worksheet-rows-main");
    if (mainTable && data.mainProducts?.length > 0) {
      data.mainProducts.forEach((item) => {
        const row = createProductRow(item);
        mainTable.appendChild(row);
      });
    }

    const palletTable = document.querySelector(".worksheet-rows-pallet");
    if (palletTable && data.palletOffers?.length > 0) {
      data.palletOffers.forEach((item) => {
        const row = createProductRow(item);
        palletTable.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Error loading table:", err);
  }
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

loadTable();
