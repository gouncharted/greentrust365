export default async function handler(req, res) {
  const { record } = req.query;

  if (!record) {
    return res.status(400).json({ error: "Missing record ID" });
  }

  try {
    const airtableBaseId = "YOUR_BASE_ID"; // e.g., appx1vVOIK3mHOuQk
    const worksheetTable = "Worksheets";
    const productTable = "Product Prices";
    const apiKey = process.env.AIRTABLE_API_KEY;

    // Fetch the worksheet
    const worksheetResponse = await fetch(
      `https://api.airtable.com/v0/${airtableBaseId}/${worksheetTable}/${record}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );
    const worksheetData = await worksheetResponse.json();

    // Fetch linked products
    const linkedProductIds = worksheetData.fields.Products; // Your linked field
    const productRecords = [];

    if (linkedProductIds && linkedProductIds.length > 0) {
      for (const id of linkedProductIds) {
        const productResponse = await fetch(
          `https://api.airtable.com/v0/${airtableBaseId}/${productTable}/${id}`,
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
          }
        );
        const productData = await productResponse.json();
        productRecords.push(productData);
      }
    }

    res.status(200).json({
      worksheet: worksheetData.fields,
      products: productRecords.map((p) => p.fields),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
