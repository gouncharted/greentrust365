async function loadWorksheet() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    // Load the table.html file
    const tableHtml = await fetch(
      "/worksheets2025/golfandsportsturf/table.html"
    ).then((res) => res.text());
    document.getElementById("table-container").innerHTML = tableHtml;
    console.log("✅ Table loaded successfully");

    // Now load worksheet data
    await loadWorksheetData(recordId);
  } catch (err) {
    console.error("Error loading worksheet:", err);
  }
}

async function loadWorksheetData(recordId) {
  try {
    const response = await fetch(`/api/fetch-worksheet?record=${recordId}`); // 🛠️ FIXED PATH

    if (!response.ok) {
      throw new Error(
        `Failed to fetch worksheet data. Status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("✅ Worksheet data loaded:", data);

    // Set page title
    if (data.pageFields?.Name) {
      document.title = data.pageFields.Name;
      const titleElement = document.querySelector(".worksheet-main-title");
      if (titleElement) titleElement.textContent = data.pageFields.Name;
    }

    // Fill Main Products Table
    const mainTable = document.querySelector(".worksheet-rows-main");
    if (mainTable && data.mainProducts?.length > 0) {
      data.mainProducts.forEach((item) => {
        const row = createProductRow(item);
        mainTable.appendChild(row);
      });
    }

    // Fill Pallet Offers Table
    const palletTable = document.querySelector(".worksheet-rows-pallet");
    if (palletTable && data.palletOffers?.length > 0) {
      data.palletOffers.forEach((item) => {
        const row = createProductRow(item);
        palletTable.appendChild(row);
      });
    }

    // Fill footnotes
    const footnoteList = document.querySelector(".worksheet-footnotes-list");
    if (footnoteList && data.footnotes?.length > 0) {
      footnoteList.innerHTML = data.footnotes
        .map((note) => `<div>${note}</div>`)
        .join("");
    }
  } catch (err) {
    console.error("Error loading worksheet data:", err);
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

// 🚀 Kick off
loadWorksheet();
