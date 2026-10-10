import { revalidateTag, revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePayloadSchema } from '@app/types';
import { serverEnv } from '@/env';

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-revalidate-secret');
  if (secret !== serverEnv.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const parsed = revalidatePayloadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid payload' }, { status: 400 });
  }

  for (const tag of parsed.data.tags) revalidateTag(tag);
  for (const path of parsed.data.paths ?? []) revalidatePath(path);

  return NextResponse.json({ revalidated: true, tags: parsed.data.tags });
}
