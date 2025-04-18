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
    const fields = data.fields;

    // Inject Airtable fields into HTML

    // Inject Hero Image if you want later
    const heroImgEl = document.querySelector(".hero-img");
    if (heroImgEl && fields["Hero Image URL"]) {
      heroImgEl.src = fields["Hero Image URL"]; // <-- you could store hero image URLs too
    }

    // Inject LGC Code
    const lgcCodeEl = document.querySelector(".lgc-code");
    if (lgcCodeEl && fields["LGC Code"]) {
      lgcCodeEl.textContent = fields["LGC Code"];
    }

    // Inject Job Number
    const jobNumberEl = document.querySelector(".job-number");
    if (jobNumberEl && fields["Job #"]) {
      jobNumberEl.textContent = fields["Job #"];
    }

    // Inject Legal HTML
    const legalHtmlEl = document.querySelector(".legal-html");
    if (legalHtmlEl && fields["Legal HTML"]) {
      legalHtmlEl.innerHTML = fields["Legal HTML"];
    }
  } catch (err) {
    console.error("Error fetching record:", err);
  }
}

// Load the data once the page is ready
document.addEventListener("DOMContentLoaded", loadGuaranteeData);
