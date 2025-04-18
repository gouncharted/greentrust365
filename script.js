// script.js

async function loadGuaranteeData() {
  const urlParams = new URLSearchParams(window.location.search);
  const recordId = urlParams.get("record");

  if (!recordId) {
    console.error("No record ID found in URL.");
    return;
  }

  try {
    const response = await fetch(`/api/fetch-records?record=${recordId}`);
    const data = await response.json();
    const record = data.fields;

    // Example injections — only inject if element exists

    const lgcCodeEl = document.querySelector(".lgc-code");
    if (lgcCodeEl && record["LGC Code"]) {
      lgcCodeEl.textContent = record["LGC Code"];
    }

    const legalHtmlEl = document.querySelector(".legal-html");
    if (legalHtmlEl && record["Legal HTML"]) {
      legalHtmlEl.innerHTML = record["Legal HTML"];
    }

    const productNameEl = document.querySelector(".product-name");
    if (productNameEl && record["Product"]) {
      productNameEl.textContent = record["Product"];
    }

    const legalYearEl = document.querySelector(".legal-year");
    if (legalYearEl && record["Legal Year"]) {
      legalYearEl.textContent = record["Legal Year"];
    }

    const jobNumberEl = document.querySelector(".job-number");
    if (jobNumberEl && record["Job #"]) {
      jobNumberEl.textContent = record["Job #"];
    }

    // Add other fields dynamically here as needed!
  } catch (err) {
    console.error("Error fetching Airtable record:", err);
  }
}

// Load after DOM is ready
document.addEventListener("DOMContentLoaded", loadGuaranteeData);
