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
    const mainProducts = data.mainProducts || [];
    const palletOffers = data.palletOffers || [];
    const footnotes = data.footnotes || [];

    // Set page title from Airtable
    if (fields["Title"]) {
      document.title = fields["Title"];
    }

    // Populate Main Products Table
    const mainTable = document.querySelector(".worksheet-rows-main");
    mainProducts.forEach((product) => {
      const row = document.createElement("div");
      row.className = `row ${getHighlightClass(product["Row Highlight"])}`;

      row.innerHTML = `
        <div class="product">${formatProductName(product["Product"])}</div>
        <div class="price">${formatPrice(product["Price"])}</div>
        <div class="x">X</div>
        <div class="equals">=</div>
      `;
      mainTable.appendChild(row);
    });

    // Populate Pallet Offers Table
    const palletTable = document.querySelector(".worksheet-rows-pallet");
    palletOffers.forEach((product) => {
      const row = document.createElement("div");
      row.className = `row ${getHighlightClass(product["Row Highlight"])}`;

      row.innerHTML = `
        <div class="product">${formatProductName(product["Product"])}</div>
        <div class="price">${formatPrice(product["Price"])}</div>
        <div class="x">X</div>
        <div class="equals">=</div>
      `;
      palletTable.appendChild(row);
    });

    // Populate Footnotes
    const footnotesList = document.querySelector(".worksheet-footnotes-list");
    footnotes.forEach((note) => {
      const p = document.createElement("p");
      p.innerHTML = note;
      footnotesList.appendChild(p);
    });
  } catch (error) {
    console.error("Failed to load worksheet data:", error);
  }
}

// Helper Functions
function getHighlightClass(highlight) {
  if (highlight === "Green") return "highlight-green";
  if (highlight === "Blue") return "highlight-blue";
  return "highlight-none";
}

function formatPrice(price) {
  if (!price) return "";
  return `$${parseFloat(price).toFixed(2)}`;
}

function formatProductName(name) {
  if (!name) return "";
  return name.replace(/\t/g, "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"); // 5 spaces for tab
}

// 🚀 Run it!
loadWorksheetData();
