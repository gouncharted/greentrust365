const airtableApiKey = 'YOUR_API_KEY';
const baseId = 'YOUR_BASE_ID';
const tableName = 'YOUR_TABLE_NAME';

fetch(`https://api.airtable.com/v0/${baseId}/${tableName}`, {
  headers: {
    Authorization: `Bearer ${airtableApiKey}`,
  }
})
.then(response => response.json())
.then(data => {
  const record = data.records[0].fields;
  document.querySelector('.headline').innerText = record.guarantee_title || 'Missing Title';
  document.querySelector('.intro-paragraph').innerText = record.intro_paragraph || 'Missing Paragraph';
})
.catch(error => console.error('Airtable Fetch Error:', error));