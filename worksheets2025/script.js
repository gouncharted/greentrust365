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

    const { pageFields, mainProducts, palletOffers, footnotes } = data;

    // Set page title
    if (pageFields["Worksheet Title"]) {
      document.title = pageFields["Worksheet Title"];
      const titleEl = document.querySelector(".worksheet-main-title");
      if (titleEl) titleEl.innerText = pageFields["Worksheet Title"];
    }

    // Set Program Year Dates
    if (pageFields["Program Year Dates"]) {
      const sectionLabels = document.querySelectorAll(".section-label");
      if (sectionLabels[0])
        sectionLabels[0].innerText = pageFields["Program Year Dates"];
    }
    if (pageFields["Early Order Dates"]) {
      const sectionLabels = document.querySelectorAll(".section-label");
      if (sectionLabels[1])
        sectionLabels[1].innerText = pageFields["Early Order Dates"];
    }

    // Populate Main Products Table
    const mainTable = document.querySelector(".worksheet-rows-main");
    if (mainTable && mainProducts.length) {
      mainProducts.forEach((product) => {
        const row = document.createElement("div");
        row.classList.add(
          "row",
          `row-${(product["Row Highlight"] || "White")
            .toLowerCase()
            .replace(" ", "-")}`
        );
        row.innerHTML = `
          <div class="worksheet-product">${product["Product Name"] || ""}</div>
          <div class="worksheet-price">$${product["Price"] || ""}</div>
          <div class="worksheet-x">X</div>
          <div class="worksheet-equals">=</div>
        `;
        mainTable.appendChild(row);
      });
    }

    // Populate Pallet Offers Table
    const palletTable = document.querySelector(".worksheet-rows-pallet");
    if (palletTable && palletOffers.length) {
      palletOffers.forEach((product) => {
        const row = document.createElement("div");
        row.classList.add(
          "row",
          `row-${(product["Row Highlight"] || "White")
            .toLowerCase()
            .replace(" ", "-")}`
        );
        row.innerHTML = `
          <div class="worksheet-product">${product["Product Name"] || ""}</div>
          <div class="worksheet-price">$${product["Price"] || ""}</div>
          <div class="worksheet-x">X</div>
          <div class="worksheet-equals">=</div>
        `;
        palletTable.appendChild(row);
      });
    }

    // Populate Footnotes
    const footnotesList = document.querySelector(".worksheet-footnotes-list");
    if (footnotesList && footnotes.length) {
      footnotes.forEach((note, index) => {
        const div = document.createElement("div");
        div.innerHTML = `<b>${index + 1}.</b> ${note}`;
        footnotesList.appendChild(div);
      });
    }
  } catch (err) {
    console.error("Error fetching worksheet data:", err);
  }
}

loadWorksheetData();
