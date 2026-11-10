import {JSDOM} from 'jsdom';
import {officialLhUrl,dateOnly} from '../../lib/shared/public-housing.mjs';
import {boundedText} from '../../lib/server/lh-api.mjs';
const text=node=>(node?.textContent??'').replace(/\s+/g,' ').trim();
export function parseLhPage(html) {
  // External HTML is parsed inertly: no script execution/resources. Only text is persisted.
  const dom=new JSDOM(html);const doc=dom.window.document;
  try{
    const complexes=[];
    for(const div of doc.querySelectorAll('[id^="wrtancSbdTab"]')){
      const name=text(div.querySelector('h4'));
      const address=[...div.querySelectorAll('.box_st4 li')].map(text).find(t=>t.startsWith('소재지 :'))?.replace(/^소재지\s*:\s*/,'')??'';
      if(name&&/^충청북도\s+옥천군(?:\s|$)/.test(address))complexes.push({name,address});
    }
    const schedules=[];const notes=[];const documents=[];
    for(const section of doc.querySelectorAll('section')){
      const heading=text(section.querySelector(':scope > h3'));
      if(heading.startsWith('공급일정')){
        const scope=text(section.querySelector('#refText'));
        const matching=complexes.find(c=>scope.includes(c.name));
        // A tabbed page initially renders another district's schedule: never inherit it.
        if(matching){
          const raw=text(section.querySelector('#sta_acpDt'));
          const dates=raw.match(/\d{4}\.\d{2}\.\d{2}/g)??[];
          schedules.push({complex:matching.name,label:raw,start:dateOnly(dates[0]),end:dateOnly(dates[1]),documents:text(section.querySelector('#sta_pprAcpDt')),results:text(section.querySelector('#sta_pzwrDt')),contract:text(section.querySelector('#sta_ctrtDt'))});
        }
      }
      if(heading==='기타사항'||heading==='접수처정보'){
        for(const p of section.querySelectorAll('pre')){const t=text(p);if(t)notes.push(t.slice(0,12000));}
      }
    }
    for(const a of doc.querySelectorAll('a')){const t=text(a);if(/\.(pdf|hwp|hwpx)$/i.test(t)&&/공고문/.test(t)&&t.length<300)documents.push(t);}
    return {complexes,schedules,notes:[...new Set(notes)],documents:[...new Set(documents)]};
  }finally{dom.window.close();}
}
export async function fetchLhPage(url){
  const safe=officialLhUrl(url);if(!safe)throw new Error('LH_URL_REJECTED');
  try{const res=await fetch(safe,{redirect:'error',signal:AbortSignal.timeout(25000)});if(!res.ok)throw new Error();return parseLhPage(await boundedText(res));}catch{throw new Error('LH_DETAIL_UNAVAILABLE');}
}
