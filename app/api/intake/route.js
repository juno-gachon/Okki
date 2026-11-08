import { handleIntake } from '../../../lib/server/intake-handler.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request){return handleIntake(request);}
export async function GET(request){return handleIntake(request);}
