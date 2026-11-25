// Uses built-in Deno.serve (Supabase Edge Runtime standard)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function requireAdmin(req: Request): Promise<Response | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token || !supabaseUrl || !supabaseAnon) {
    return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: supabaseAnon, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const user = await userRes.json();
  if (user?.app_metadata?.is_admin !== true) {
    return new Response(JSON.stringify({ ok: false, error: 'Admin privileges required' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return null;
}

function escapeDriveQueryValue(val: string): string {
  return String(val || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function getAccessToken(clientId: string, clientSecret: string, refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to get Google access token: ' + (data.error_description || data.error || JSON.stringify(data)));
  }
  return data.access_token;
}

async function getOrCreateSubfolder(token: string, parentId: string, folderName: string): Promise<string> {
  if (!/^[A-Za-z0-9_-]+$/.test(parentId)) {
    throw new Error('Invalid parentFolderId');
  }
  const safeFolder = escapeDriveQueryValue(folderName);
  // Check if folder exists
  const query = `name='${safeFolder}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const searchData = await searchRes.json();
  
  if (searchData.error) {
    throw new Error('Drive API Error: ' + searchData.error.message);
  }

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    })
  });
  const createData = await createRes.json();
  
  if (createData.error) {
    throw new Error('Failed to create folder: ' + createData.error.message);
  }
  
  return createData.id;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authErr = await requireAdmin(req);
    if (authErr) return authErr;

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Google OAuth secrets not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { fileName, fileBase64, parentFolderId, subFolder } = await req.json();

    if (!fileName || !fileBase64 || !parentFolderId || !subFolder) {
      return new Response(
        JSON.stringify({ ok: false, error: 'fileName, fileBase64, parentFolderId, and subFolder are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = await getAccessToken(clientId, clientSecret, refreshToken);
    
    // Get or Create Month folder
    const targetFolderId = await getOrCreateSubfolder(token, parentFolderId, subFolder);

    // Decode Base64
    const binaryString = atob(fileBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const fileBlob = new Blob([bytes], { type: 'application/pdf' });

    // Upload File using Multipart
    const metadata = {
      name: fileName,
      parents: [targetFolderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', fileBlob);

    const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });
    
    const uploadData = await uploadRes.json();
    
    if (uploadData.error) {
      throw new Error('Upload failed: ' + uploadData.error.message);
    }

    return new Response(
      JSON.stringify({ ok: true, fileId: uploadData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('upload-to-drive error:', err);
    return new Response(
      JSON.stringify({ ok: false, error: err.message || String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
