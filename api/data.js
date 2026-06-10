export default async function handler(req, res) {
  // CORS Headers para o caso de acesso cross-origin
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase credentials not configured in Vercel' });
  }

  try {
    if (req.method === 'GET') {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sagaflix_db?id=eq.1&select=data`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      const result = await response.json();
      
      if (!result || result.length === 0) {
        return res.status(404).json({ error: 'Database entry not found' });
      }

      res.status(200).json(result[0].data);
    } 
    else if (req.method === 'POST') {
      const newData = req.body;
      const response = await fetch(`${SUPABASE_URL}/rest/v1/sagaflix_db?id=eq.1`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ data: newData })
      });

      if (!response.ok) {
        throw new Error('Failed to update Supabase');
      }

      res.status(200).json({ success: true });
    } 
    else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
