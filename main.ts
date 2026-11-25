import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDossier} from './vendor/makefun-board.ts';

const base=fileURLToPath(new URL('.',import.meta.url));
const inputIndex=process.argv.indexOf('--input');
const input=inputIndex>=0 ? process.argv[inputIndex+1] : '/input/snapshot.json';
const out=process.env.MAKEFUN_OUTPUT_DIR || '/output';
const snapshot=JSON.parse(readFileSync(input,'utf8'));
const watch=new Set(snapshot.watchlist);
const day=86400000;
const asof=Date.parse(snapshot.as_of+'T00:00:00Z');
// Apply the published exclusion rule to exploratory rows too; the snapshot has no parent field.
const excludedCategories=new Set(['Bridge','Canonical Bridge','Liquid Staking','Liquid Restaking','Restaked BTC','CEX']);
const isExploratory=(p:any)=>!p.symbol&&!p.gecko_id&&p.mcap_usd==null&&!excludedCategories.has(p.category||'')&&!/\b(wrapped|staked|staking)\b/i.test(p.name)&&!/\s(?:v\d+(?:\.\d+)?|\d+\.\d+)$/i.test(p.name)&&!/^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i.test(p.name);
const candidates=snapshot.protocols.filter((p:any)=>watch.has(p.slug)||isExploratory(p));
const plans=(p:any)=>{
 const category=(p.category||'protocol').toLowerCase();
 const chain=(p.chains||[])[0]||'a supported network';
 const action=category.includes('lend')?'supply a small amount to a supported lending market':category.includes('dex')?'perform a small swap and compare the quoted route and slippage':category.includes('yield')?'inspect a vault and deposit only an amount you can afford to lose':'try one core product action after reading the protocol documentation';
 return [
  `Verify ${p.name}'s official site and current token status independently; allow 5–10 minutes and spend nothing. Beware lookalike links.`,
  `On ${chain}, ${action}. Allow 10–20 minutes; network fees and any deposited principal vary and can be lost.`,
  `Record the transaction and check the official eligibility rules before repeating. Allow 5 minutes; no reward or future token is guaranteed.`,
  `Review contract, bridge and withdrawal risks and revoke unnecessary approvals. Allow 5–10 minutes; a network fee may apply.`
 ];
};
const rows=candidates.map((p:any)=>{
 const age=p.listed_at ? Math.max(0,Math.floor((asof-Date.parse(p.listed_at+'T00:00:00Z'))/day)) : null;
 const g=p.change_7d==null?0:Math.max(-50,Math.min(100,p.change_7d));
 const ageFactor=0.65+0.35*Math.min(age??365,1095)/1095;
 const growthFactor=1+g/250;
 const implied=Math.max(1,Math.round(p.tvl_usd*0.25*ageFactor*growthFactor));
 return {...p,age_days:age,watchlist:watch.has(p.slug),implied_value_usd:implied,farm_steps:plans(p)};
}).sort((a:any,b:any)=>b.implied_value_usd-a.implied_value_usd||a.slug.localeCompare(b.slug)).map((p:any,i:number)=>({...p,rank:i+1}));
mkdirSync(out,{recursive:true});
writeFileSync(join(out,'board.json'),JSON.stringify({rows}));
const live=snapshot.protocols
 .filter((p:any)=>(p.symbol||p.gecko_id)&&p.mcap_usd>0)
 .sort((a:any,b:any)=>b.mcap_usd-a.mcap_usd)
 .slice(0,100)
 .map((p:any)=>({name:p.name,slug:p.slug,symbol:p.symbol,mcap_usd:p.mcap_usd,tvl_usd:p.tvl_usd,category:p.category,chains:p.chains}));
writeFileSync(join(out,'data.js'),`window.RADAR=${JSON.stringify({as_of:snapshot.as_of,source:snapshot.source,rows,live})};`);
cpSync(join(base,'dashboard'),join(out,'dashboard'),{recursive:true});
cpSync(join(base,'screenshots'),join(out,'screenshots'),{recursive:true});
writeFileSync(join(out,'dossier.json'),buildDossier(out,{text_max_bytes:65536}));
console.log(`Wrote ${rows.length} rows including ${snapshot.watchlist.length} required watchlist entries.`);
