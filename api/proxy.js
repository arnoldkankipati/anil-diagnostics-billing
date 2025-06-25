const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let body = '';

  try {
    // Read raw body stream
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        res.status(400).json({ error: 'Invalid JSON body' });
        return;
      }

      try {
        const response = await fetch(
          'https://script.google.com/macros/s/AKfycby1FvIFCs6XQGME4-R8ATw3NKnbiWP1oDqny1HH-ew8yBjU7ZinxEH0FyU0wpQPIHA0aw/exec',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed)
          }
        );

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          data = { error: 'Invalid JSON from Apps Script', raw: text };
        }

        res.status(200).json(data);
      } catch (err) {
        res.status(500).json({ error: 'Proxy error', details: err.toString() });
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process request', details: err.toString() });
  }
};
