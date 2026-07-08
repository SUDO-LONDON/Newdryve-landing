import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { get } from '@vercel/blob';
import { ADMIN_SESSION_COOKIE, verifySessionToken } from '@/lib/adminAuth';

export async function GET(req: Request) {
  const sessionToken = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifySessionToken(sessionToken)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }

  const key = new URL(req.url).searchParams.get('key');
  if (!key || !key.startsWith('onboarding/')) {
    return NextResponse.json({ error: 'Invalid document key.' }, { status: 400 });
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return NextResponse.json({ error: 'File storage is not configured.' }, { status: 500 });
  }

  const result = await get(key, { access: 'private', token: blobToken });
  if (!result || result.statusCode !== 200) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'Content-Disposition': result.blob.contentDisposition,
    },
  });
}
