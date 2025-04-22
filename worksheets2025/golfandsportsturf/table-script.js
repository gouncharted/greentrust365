function createProductRow(item) {
  const row = document.createElement("div");
  row.className = "product-row";

  const title = document.createElement("div");
  title.className = "product-title";
  title.textContent = item["Product"] || "";

  const dollarSign = document.createElement("div");
  dollarSign.className = "icon left-stroke";
  dollarSign.textContent = "$";

  const price = document.createElement("div");
  price.className = "right-stroke";
  price.textContent = formatPrice(item["Price"]);

  const xSign = document.createElement("div");
  xSign.className = "icon right-stroke";
  xSign.textContent = "X";

  const blank1 = document.createElement("div");
  blank1.className = "blank";

  const equalSign = document.createElement("div");
  equalSign.className = "icon outside-stroke";
  equalSign.textContent = "=";

  const blank2 = document.createElement("div");
  blank2.className = "blank";

  row.append(title, dollarSign, price, xSign, blank1, equalSign, blank2);
  return row;
}

function formatPrice(price) {
  if (typeof price === "number") {
    return price.toFixed(2);
  }
  return "";
}

async function loadTableData() {
  const res = await fetch("/api/fetch-table-records");
  const data = await res.json();

  console.log("Loaded product data:", data.records);

  const leftCol = document.getElementById("left-products");
  const rightCol = document.getElementById("right-products");

  const halfway = Math.ceil(data.records.length / 2);

  data.records.forEach((record, index) => {
    const row = createProductRow(record.fields);
    if (index < halfway) {
      leftCol.appendChild(row);
    } else {
      rightCol.appendChild(row);
    }
  });
}

loadTableData();
