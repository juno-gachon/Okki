import { handleIntake } from '../../../../../lib/server/intake-handler.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request,{params}){return handleIntake(request,'photo:'+(await params).id);}
