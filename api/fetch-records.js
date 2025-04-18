export default async function handler(req, res) {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = 'Guarantees';
  const viewName = 'Grid view';

  const response = await fetch(`https://api.airtable.com/v0/${baseId}/${tableName}?view=${encodeURIComponent(viewName)}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    }
  });

  if (!response.ok) {
    return res.status(response.status).json({ error: 'Error fetching Airtable records' });
  }

  const data = await response.json();
  res.status(200).json(data);
}
