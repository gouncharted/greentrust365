async function loadWorksheetData() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    const response = await fetch(
      `/worksheets2025/api/fetch-worksheet?record=${recordId}`
    );
    const data = await response.json();

    const fields = data.pageFields;
    const mainProducts = data.mainProducts;
    const palletOffers = data.palletOffers;
    const footnotes = data.footnotes;

    // === Inject Page Title ===
    if (fields["Guarantee"]) {
      document.title = fields["Guarantee"];
    }

    // === Inject Main Products Table ===
    const mainTable = document.querySelector(".worksheet-rows-main");
    if (mainTable && mainProducts.length > 0) {
      mainProducts.forEach((product) => {
        const row = document.createElement("div");
        row.className = `row worksheet-row ${
          product["Row Highlight"] === "Blue"
            ? "highlight-blue"
            : product["Row Highlight"] === "Green"
            ? "highlight-green"
            : "worksheet-row-white"
        }`;

        row.innerHTML = `
          <div class="worksheet-product">${product["Product Name"] || ""}</div>
          <div class="worksheet-price">${
            product["Price"] ? `$${product["Price"]}` : ""
          }</div>
          <div class="worksheet-x">X</div>
          <div class="worksheet-equals">=</div>
        `;
        mainTable.appendChild(row);
      });
    }

    // === Inject Pallet Offers Table ===
    const palletTable = document.querySelector(".worksheet-rows-pallet");
    if (palletTable && palletOffers.length > 0) {
      palletOffers.forEach((product) => {
        const row = document.createElement("div");
        row.className = `row worksheet-row ${
          product["Row Highlight"] === "Blue"
            ? "highlight-blue"
            : product["Row Highlight"] === "Green"
            ? "highlight-green"
            : "worksheet-row-white"
        }`;

        row.innerHTML = `
          <div class="worksheet-product">${product["Product Name"] || ""}</div>
          <div class="worksheet-price">${
            product["Price"] ? `$${product["Price"]}` : ""
          }</div>
          <div class="worksheet-x">X</div>
          <div class="worksheet-equals">=</div>
        `;
        palletTable.appendChild(row);
      });
    }

    // === Inject Footnotes ===
    const footnotesContainer = document.querySelector(
      ".worksheet-footnotes-list"
    );
    if (footnotesContainer && footnotes.length > 0) {
      footnotes.forEach((note) => {
        const p = document.createElement("p");
        p.innerHTML = note;
        footnotesContainer.appendChild(p);
      });
    }
  } catch (err) {
    console.error("Error fetching Worksheet record:", err);
  }
}

loadWorksheetData();
