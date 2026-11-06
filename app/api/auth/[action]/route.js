import { handleAuth } from '../../../../lib/server/auth-handler.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  return handleAuth(request, (await params).action);
}

export async function POST(request, { params }) {
  return handleAuth(request, (await params).action);
}
