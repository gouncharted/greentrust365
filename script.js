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

    // Uncomment this if you want to debug what fields came in
    // console.log(fields);

    // Inject Hero Image
    const heroImgEl = document.querySelector(".hero-img");
    if (heroImgEl && fields["Hero Image"] && fields["Hero Image"][0]) {
      heroImgEl.src = fields["Hero Image"][0].url;
    }

    // Inject Product Logo
    const logoImgEl = document.querySelector(".sheet-logo");
    if (logoImgEl && fields["Logo URL"]) {
      logoImgEl.src = fields["Logo URL"];
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

    // (Optional future fields: you can expand here as needed)
  } catch (err) {
    console.error("Error fetching Airtable record:", err);
  }
}

// 🚀 Make sure the fetch actually runs
loadGuaranteeData();
