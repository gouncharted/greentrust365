export default async function handler(req, res) {
  const baseId = "appx1vVOIK3mHOuQk"; // Base ID (unchanged)
  const tableName = "GT365GTWS2025"; // UPDATED

  const url = `https://api.airtable.com/v0/${baseId}/${tableName}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
    },
  });

  if (!response.ok) {
    console.error("Airtable Fetch Error:", await response.text());
    return res.status(500).json({ error: "Failed to fetch Airtable table" });
  }

  const data = await response.json();
  res.status(200).json(data);
}
