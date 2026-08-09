export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight (OPTIONS) request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // ✅ Parse the path from the request URL
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathSegments = url.pathname.replace(/^\/api\//, '').split('/').filter(Boolean);
  const path = pathSegments.join('/');
  const targetUrl = `https://dummy-todo-api.onrender.com/${path}`;

  // Prepare fetch options
  const fetchOptions = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Forward the request body for non‑GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    fetchOptions.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from backend' });
  }
}