async function loadWorksheetData(recordId) {
  try {
    const res = await fetch(
      `/api/worksheets/fetch-table-records?record=${recordId}`
    );
    const data = await res.json();

    const pageFields = data.pageFields;
    const mainProducts = data.mainProducts;
    const palletOffers = data.palletOffers;
    const footnotes = data.footnotes;

    // Update title
    if (pageFields["Guarantee"]) {
      document.title = pageFields["Guarantee"];
      const titleEl = document.querySelector(".worksheet-main-title");
      if (titleEl) titleEl.textContent = pageFields["Guarantee"];
    }

    // Update Program Year
    const yearEl = document.getElementById("program-year");
    if (yearEl && pageFields["Program Year"]) {
      yearEl.textContent = pageFields["Program Year"];
    }

    // Update Early Order Period
    const earlyOrderEl = document.getElementById("early-order-period");
    if (earlyOrderEl && pageFields["Early Order Dates"]) {
      earlyOrderEl.textContent = pageFields["Early Order Dates"];
    }

    // Populate main products
    const mainContainer = document.querySelector(".worksheet-rows-main");
    if (mainProducts.length && mainContainer) {
      mainProducts.forEach((product) => {
        const row = document.createElement("div");
        row.classList.add(
          "row",
          `worksheet-row-${(product["Row Highlight"] || "white")
            .toLowerCase()
            .replace(" ", "-")}`
        );
        row.innerHTML = `
            <div class="worksheet-product">${product["Product"] || ""}</div>
            <div class="worksheet-price">${product["Price"] || ""}</div>
            <div class="worksheet-x">X</div>
            <div class="worksheet-equals">=</div>
          `;
        mainContainer.appendChild(row);
      });
    }

    // Populate pallet offers
    const palletContainer = document.querySelector(".worksheet-rows-pallet");
    if (palletOffers.length && palletContainer) {
      palletOffers.forEach((offer) => {
        const row = document.createElement("div");
        row.classList.add(
          "row",
          `worksheet-row-${(offer["Row Highlight"] || "white")
            .toLowerCase()
            .replace(" ", "-")}`
        );
        row.innerHTML = `
            <div class="worksheet-product">${offer["Product"] || ""}</div>
            <div class="worksheet-price">${offer["Price"] || ""}</div>
            <div class="worksheet-x">X</div>
            <div class="worksheet-equals">=</div>
          `;
        palletContainer.appendChild(row);
      });
    }

    // Populate footnotes
    const footnotesContainer = document.querySelector(
      ".worksheet-footnotes-list"
    );
    if (footnotes.length && footnotesContainer) {
      footnotesContainer.innerHTML = footnotes
        .map((note) => `<p>${note}</p>`)
        .join("");
    }
  } catch (err) {
    console.error("Error fetching worksheet data:", err);
  }
}
