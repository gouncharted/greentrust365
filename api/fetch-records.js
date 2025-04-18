// api/fetch-records.js

export default async function handler(req, res) {
  const { record } = req.query;

  if (!record) {
    return res.status(400).json({ error: "Record ID is required" });
  }

  const baseId = "appx1vVOIK3mHOuQk"; // Your Airtable Base ID
  const tableName = "Guarantees"; // Your table name

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}/${record}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    },
  });

  if (!response.ok) {
    console.error("Airtable Fetch Error:", await response.text());
    return res.status(500).json({ error: "Failed to fetch Airtable record" });
  }

  const data = await response.json();
  res.status(200).json(data);
}