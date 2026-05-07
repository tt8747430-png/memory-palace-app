import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser, createSupabaseFromCookies } from '@/shared/lib/supabase';
import { checkRateLimit } from '@/shared/lib/ratelimit';
import { env } from '@/shared/lib/env';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

// Magic-byte signatures for allowed image types.
// SVG is excluded — inline SVG can carry arbitrary JavaScript.
function detectMime(buf: Uint8Array): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return 'image/gif';
  // WebP: "RIFF????WEBP" — bytes 0–3 are RIFF, bytes 8–11 are WEBP
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await checkRateLimit(user.id, 'write');
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await request.arrayBuffer();
  } catch {
    return NextResponse.json({ error: 'Failed to read request body' }, { status: 400 });
  }

  if (buffer.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 });
  }

  const bytes = new Uint8Array(buffer);
  const mime = detectMime(bytes);
  if (!mime) {
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: JPEG, PNG, GIF, WebP.' },
      { status: 415 },
    );
  }

  const supabase = await createSupabaseFromCookies();
  const ext = mime.split('/')[1]!;
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from('node-attachments')
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (storageError) {
    console.error('[upload] Supabase storage error:', storageError);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data } = supabase.storage.from('node-attachments').getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl }, { status: 201, headers: CORS_HEADERS });
}
