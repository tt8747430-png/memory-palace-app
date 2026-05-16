import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  const form = await request.formData();
  const title = (form.get('title') as string | null) ?? '';
  const text = (form.get('text') as string | null) ?? '';
  const url = (form.get('url') as string | null) ?? '';

  const params = new URLSearchParams();
  if (title) params.set('shared_title', title);
  if (text) params.set('shared_text', text);
  if (url) params.set('shared_url', url);

  redirect(`/?${params.toString()}`);
}
