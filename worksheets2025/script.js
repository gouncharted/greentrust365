async function loadWorksheetData() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    const response = await fetch(`/api/fetch-worksheet?record=${recordId}`);
    const data = await response.json();
    const worksheet = data.worksheet;
    const products = data.products;

    // Populate page title
    if (worksheet.Name) {
      document.title = worksheet.Name;
    }

    // Populate header fields
    const titleEl = document.querySelector(".worksheet-title");
    const dateEl = document.querySelector(".worksheet-dates");

    if (titleEl && worksheet.Name) {
      titleEl.textContent = worksheet.Name;
    }
    if (dateEl && worksheet.Program_Year) {
      dateEl.textContent = `Program Period: October 1, ${
        worksheet.Program_Year - 1
      } - January 31, ${worksheet.Program_Year}`;
    }

    // Populate products into the main rows
    const mainRowsEl = document.querySelector(".worksheet-rows-main");
    if (mainRowsEl) {
      products.forEach((product) => {
        const row = document.createElement("div");
        row.className = "worksheet-row";

        // Handle row highlight background
        if (product["Row Highlight"] === "Blue Highlight") {
          row.classList.add("highlight-blue");
        } else if (product["Row Highlight"] === "Green Highlight") {
          row.classList.add("highlight-green");
        }

        // --- Create product name ---
        const productName = document.createElement("div");
        productName.className = "worksheet-product";
        productName.innerHTML = product.Product || "";

        // --- Create price ---
        const price = document.createElement("div");
        price.className = "worksheet-price";
        price.textContent = product.Price ? `$${product.Price.toFixed(2)}` : "";

        // --- Create X placeholder ---
        const xPlaceholder = document.createElement("div");
        xPlaceholder.className = "worksheet-x";
        xPlaceholder.textContent = "X";

        // --- Create = placeholder ---
        const equalsPlaceholder = document.createElement("div");
        equalsPlaceholder.className = "worksheet-equals";
        equalsPlaceholder.textContent = "=";

        // --- Append all cells into the row ---
        row.appendChild(productName);
        row.appendChild(price);
        row.appendChild(xPlaceholder);
        row.appendChild(equalsPlaceholder);

        // --- Append the row to the container ---
        mainRowsEl.appendChild(row);
      });
    }
  } catch (err) {
    console.error("Error fetching Airtable record:", err);
  }
}

// 🚀 Auto-run
loadWorksheetData();
