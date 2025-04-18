fetch("/api/fetch-records")
  .then(res => res.json())
  .then(data => {
    const record = data.records[0].fields;

    // Inject LGC Code
    const lgcCodeEl = document.querySelector(".lgc-code");
    if (lgcCodeEl && record["LGC Code"]) {
      lgcCodeEl.innerText = record["LGC Code"];
    }

    // Inject Legal Copy (HTML-safe)
    const legalEl = document.querySelector(".legal-html");
    if (legalEl && record["Legal HTML"]) {
      legalEl.innerHTML = record["Legal HTML"];
    }
  })
  .catch(err => console.error("Airtable Fetch Error:", err));
