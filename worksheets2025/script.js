async function loadWorksheet() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    // Load the table layout
    const tableHtml = await fetch(
      "/worksheets2025/golfandsportsturf/table.html"
    ).then((res) => res.text());
    document.getElementById("table-container").innerHTML = tableHtml;

    // Now load the worksheet data
    await loadWorksheetData(recordId);
  } catch (err) {
    console.error("Error loading worksheet:", err);
  }
}

async function loadWorksheetData(recordId) {
  console.log("Loading worksheet data for:", recordId);

  try {
    const response = await fetch(
      `/worksheets2025/api/fetch-worksheet?record=${recordId}`
    );
    const data = await response.json();

    if (!data.pageFields) {
      console.error("No pageFields found in response.");
      return;
    }

    // Update page title if available
    if (data.pageFields.Name) {
      document.title = data.pageFields.Name;
      const titleElement = document.querySelector(".worksheet-main-title");
      if (titleElement) {
        titleElement.textContent = data.pageFields.Name;
      }
    }

    // Map product rows
    const mainProductsContainer = document.querySelector(
      ".worksheet-rows-main"
    );
    const palletProductsContainer = document.querySelector(
      ".worksheet-rows-pallet"
    );

    data.mainProducts.forEach((product) => {
      const row = buildProductRow(product);
      if (product.Section === "Product") {
        mainProductsContainer.appendChild(row);
      } else if (product.Section === "Pallet Offer") {
        palletProductsContainer.appendChild(row);
      }
    });
  } catch (err) {
    console.error("Error loading worksheet data:", err);
  }
}

function buildProductRow(product) {
  const row = document.createElement("div");
  row.classList.add("row");

  // Apply row highlight if exists
  if (product["Row Highlight"] === "Blue Highlight") {
    row.classList.add("highlight-blue");
  } else if (product["Row Highlight"] === "Green Highlight") {
    row.classList.add("highlight-green");
  }

  // Create the product cell
  const productCell = document.createElement("div");
  productCell.classList.add("product");

  if (product.Product) {
    const lines = product.Product.split("\n");
    const mainLine = lines[0];
    const volumeLine = lines[1] ? lines[1] : "";

    productCell.innerHTML = mainLine;
    if (volumeLine) {
      productCell.innerHTML += `<br><span class="volume-line">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${volumeLine}</span>`;
    }
  }

  // Create the price cell
  const priceCell = document.createElement("div");
  priceCell.classList.add("price");
  priceCell.textContent = product.Price
    ? `$${parseFloat(product.Price).toFixed(2)}`
    : "";

  // Create the X cell
  const xCell = document.createElement("div");
  xCell.classList.add("x");
  xCell.textContent = "X";

  // Create the = cell
  const equalsCell = document.createElement("div");
  equalsCell.classList.add("equals");
  equalsCell.textContent = "=";

  // Append all cells to row
  row.appendChild(productCell);
  row.appendChild(priceCell);
  row.appendChild(xCell);
  row.appendChild(equalsCell);

  return row;
}

// Kick it off
loadWorksheet();
