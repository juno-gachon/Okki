import {handleAdmin} from '../../lib/server/admin-handler.mjs';
import {NextRequest,NextResponse} from 'next/server.js';
export const dynamic='force-dynamic';
export async function GET(request){
 const url=new URL('/api/admin?session=1',request.url);
 const check=await handleAdmin(new NextRequest(url,{headers:request.headers}));
 if(!check.ok)return new NextResponse('페이지를 찾을 수 없습니다.',{status:404,headers:{'Cache-Control':'private, no-store'}});
 const response=new NextResponse('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>옥키 운영 관리</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/admin.css"><body class="admin-page"><main class="admin-shell"><header class="admin-header"><div><small>OKKI OPERATIONS</small><h1>신청 관리</h1></div><a href="/#/account">내 계정으로</a></header><p class="admin-notice">신청자 번호는 소유 미인증입니다. 확인 완료는 임대 가능·계약 확정을 의미하지 않습니다.</p><div id="admin-root"></div></main><script src="/admin.js"></script></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'private, no-store','Vary':'Cookie'}});
 for(const cookie of check.cookies.getAll())response.cookies.set(cookie);
 return response;
}
