import {readFileSync,writeFileSync,mkdirSync,cpSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDossier} from './vendor/makefun-board.ts';

const base=fileURLToPath(new URL('.',import.meta.url));
const arg=process.argv.indexOf('--input');
const input=arg>=0?process.argv[arg+1]:'/input/snapshot.json';
const out=process.env.MAKEFUN_OUTPUT_DIR||'/output';
const snapshot=JSON.parse(readFileSync(input,'utf8'));
const watch=new Set(snapshot.watchlist);
const days=86400000;
const asOf=Date.parse(snapshot.as_of+'T00:00:00Z');

function median(values:number[]):number {
 const sorted=[...values].filter(Number.isFinite).sort((a,b)=>a-b);
 if(!sorted.length)return 0;
 const mid=Math.floor(sorted.length/2);
 return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
}
function quantile(values:number[],q:number):number {
 const sorted=[...values].filter(Number.isFinite).sort((a,b)=>a-b);
 if(!sorted.length)return 0;
 return sorted[Math.min(sorted.length-1,Math.max(0,Math.floor((sorted.length-1)*q)))];
}
const logCap=(p:any)=>Math.log(Math.max(1,p.mcap_usd));
const logTvl=(p:any)=>Math.log(Math.max(1,p.tvl_usd));
function ageDays(p:any):number|null {
 return p.listed_at?Math.max(0,Math.floor((asOf-Date.parse(p.listed_at+'T00:00:00Z'))/days)):null;
}
function solve(matrix:number[][],target:number[]):number[] {
 const a=matrix.map((row,i)=>[...row,target[i]]);
 const n=target.length;
 for(let col=0;col<n;col++){
  let pivot=col;
  for(let row=col+1;row<n;row++)if(Math.abs(a[row][col])>Math.abs(a[pivot][col]))pivot=row;
  if(Math.abs(a[pivot][col])<1e-12)continue;
  [a[col],a[pivot]]=[a[pivot],a[col]];
  const divisor=a[col][col];
  for(let j=col;j<=n;j++)a[col][j]/=divisor;
  for(let row=0;row<n;row++)if(row!==col){
   const factor=a[row][col];
   for(let j=col;j<=n;j++)a[row][j]-=factor*a[col][j];
  }
 }
 return a.map(row=>Number.isFinite(row[n])?row[n]:0);
}
function getFeatures(p:any,fields:string[],impute:any):number[] {
 return fields.map(field=>{
  if(field==='tvl')return logTvl(p)-Math.log(50000000);
  if(field==='age'){
   const age=ageDays(p)??impute.age;
   return Math.log(1+Math.max(0,age)/365)-impute.ageCenter;
  }
  const growth=p.change_7d==null?impute.growth:p.change_7d;
  return Math.max(-50,Math.min(100,growth))/100-impute.growthCenter;
 });
}
function fitHuber(rows:any[],fields:string[]):any {
 const rawAges=rows.map(ageDays).filter((v:any)=>v!=null);
 const rawGrowth=rows.map(p=>p.change_7d).filter((v:any)=>v!=null);
 const impute={
  age:median(rawAges.length?rawAges:[365]),
  ageCenter:median(rows.map(p=>Math.log(1+Math.max(0,ageDays(p)??365)/365))),
  growth:median(rawGrowth.length?rawGrowth:[0]),
  growthCenter:median(rows.map(p=>Math.max(-50,Math.min(100,p.change_7d??0))/100))
 };
 const x=rows.map(p=>[1,...getFeatures(p,fields,impute)]);
 const y=rows.map(logCap);
 let weights=rows.map(()=>1);
 let beta=[median(y),...fields.map(()=>0)];
 for(let iteration=0;iteration<30;iteration++){
  const size=fields.length+1;
  const a=Array.from({length:size},()=>Array(size).fill(0));
  const b=Array(size).fill(0);
  for(let r=0;r<x.length;r++)for(let i=0;i<size;i++){
   b[i]+=weights[r]*x[r][i]*y[r];
   for(let j=0;j<size;j++)a[i][j]+=weights[r]*x[r][i]*x[r][j];
  }
  for(let i=1;i<size;i++)a[i][i]+=0.08;
  const next=solve(a,b);
  const residuals=x.map((row,i)=>y[i]-row.reduce((sum,value,j)=>sum+value*next[j],0));
  const center=median(residuals);
  const scale=Math.max(0.12,1.4826*median(residuals.map(v=>Math.abs(v-center))));
  weights=residuals.map(v=>Math.min(1,1.345*scale/Math.max(Math.abs(v-center),1e-8)));
  const delta=next.reduce((sum,v,i)=>sum+Math.abs(v-beta[i]),0);
  beta=next;
  if(delta<1e-7)break;
 }
 return {
  predict:(p:any)=>[1,...getFeatures(p,fields,impute)].reduce((sum,v,i)=>sum+v*beta[i],0),
  beta,
  impute,
  parameters:{fields,coefficients:beta}
 };
}
function fitSizeCurve(rows:any[]):any {
 const slopes:number[]=[];
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  const dx=logTvl(rows[i])-logTvl(rows[j]);
  if(Math.abs(dx)>0.05)slopes.push((logCap(rows[i])-logCap(rows[j]))/dx);
 }
 const slope=median(slopes);
 const intercept=median(rows.map(p=>logCap(p)-slope*logTvl(p)));
 return {predict:(p:any)=>intercept+slope*logTvl(p),slope,intercept};
}
function fitModel(name:string,rows:any[]):any {
 if(name==='flat'){
  const value=median(rows.map(logCap));
  return {predict:()=>value,parameters:{log_market_cap:value}};
 }
 if(name==='ratio'){
  const intercept=median(rows.map(p=>logCap(p)-logTvl(p)));
  return {predict:(p:any)=>intercept+logTvl(p),parameters:{log_cap_tvl:intercept}};
 }
 if(name==='size_curve')return fitSizeCurve(rows);
 if(name==='size_age')return fitHuber(rows,['tvl','age']);
 if(name==='size_growth')return fitHuber(rows,['tvl','growth']);
 if(name==='size_age_growth')return fitHuber(rows,['tvl','age','growth']);
 const curve=fitSizeCurve(rows);
 const categories=new Map<string,{count:number,bias:number}>();
 const names=new Set(rows.map(p=>p.category||''));
 for(const category of names){
  const peers=rows.filter(p=>(p.category||'')===category);
  if(peers.length<8)continue;
  const bias=median(peers.map(p=>logCap(p)-curve.predict(p)));
  categories.set(category,{count:peers.length,bias});
 }
 return {
  predict:(p:any)=>{
   const adjustment=categories.get(p.category||'');
   return curve.predict(p)+(adjustment?adjustment.count/(adjustment.count+12)*adjustment.bias:0);
  },
  parameters:{slope:curve.slope,intercept:curve.intercept,category_adjustments:categories.size}
 };
}
function modelMetrics(errors:number[]):any {
 return {
  n:errors.length,
  mae_log:+(errors.reduce((sum,v)=>sum+Math.abs(v),0)/Math.max(1,errors.length)).toFixed(4),
  rmse_log:+Math.sqrt(errors.reduce((sum,v)=>sum+v*v,0)/Math.max(1,errors.length)).toFixed(4),
  median_factor_error:+Math.exp(median(errors.map(v=>Math.abs(v)))).toFixed(2),
  within_2x_percent:+(100*errors.filter(v=>Math.abs(v)<=Math.log(2)).length/Math.max(1,errors.length)).toFixed(1)
 };
}
const comparable=snapshot.protocols.filter((p:any)=>
 (p.symbol||p.gecko_id)&&p.mcap_usd>0&&p.tvl_usd>0
);
const dated=[...comparable].filter((p:any)=>p.listed_at)
 .sort((a:any,b:any)=>a.listed_at.localeCompare(b.listed_at)||a.slug.localeCompare(b.slug));
const variants=['flat','ratio','size_curve','size_age','size_growth','size_age_growth','size_category'];
const errors=new Map<string,number[]>();
for(const name of variants)errors.set(name,[]);
const foldSize=Math.max(5,Math.floor(dated.length*0.1));
for(let fold=0;fold<5;fold++){
 const start=Math.floor(dated.length*0.5)+fold*foldSize;
 const train=dated.slice(0,start);
 const test=dated.slice(start,Math.min(dated.length,start+foldSize));
 if(train.length<20||!test.length)continue;
 for(const name of variants){
  const model=fitModel(name,train);
  for(const row of test)errors.get(name)!.push(model.predict(row)-logCap(row));
 }
}
const validation=variants.map(name=>({name,...modelMetrics(errors.get(name)!)}));
const selectable=validation.filter(v=>!['flat'].includes(v.name));
const best=selectable.reduce((a,b)=>b.mae_log<a.mae_log?b:a,selectable[0]);
const complexity:any={ratio:0,size_curve:1,size_category:2,size_age:2,size_growth:2,size_age_growth:3};
const chosen=selectable
 .filter(v=>v.mae_log<=best.mae_log+0.03)
 .sort((a,b)=>(complexity[a.name]-complexity[b.name])||a.mae_log-b.mae_log)[0]?.name||'size_curve';
const model=fitModel(chosen,comparable);
const oof=errors.get(chosen)||[];
const intervalFactor=Math.exp(quantile(oof.map(v=>Math.abs(v)),0.8));
const globalMultiple=median(comparable.map((p:any)=>Math.max(0.001,p.mcap_usd/p.tvl_usd)));
const categoryStats=new Map<string,{total:number,token:number,multiples:number[]}>();
for(const p of snapshot.protocols){
 const category=p.category||'Unclassified';
 const current=categoryStats.get(category)||{total:0,token:0,multiples:[]};
 current.total++;
 if(p.symbol||p.gecko_id||p.mcap_usd>0){
  current.token++;
  if(p.mcap_usd>0&&p.tvl_usd>0)current.multiples.push(p.mcap_usd/p.tvl_usd);
 }
 categoryStats.set(category,current);
}
function peerContext(category:string):any {
 const entry=categoryStats.get(category||'Unclassified');
 const peers=entry?.multiples||[];
 return {
  multiple:peers.length>=3?median(peers):globalMultiple,
  peer_count:peers.length,
  token_record_share:entry?(entry.token+0.5)/(entry.total+1):0.5,
  category_total:entry?.total||0
 };
}
function exclusion(p:any):string|null {
 const category=p.category||'';
 if(['Bridge','Canonical Bridge','Liquid Staking','Liquid Restaking','Restaked BTC','CEX'].includes(category))return 'Screened category: '+category;
 if(/\b(wrapped|staked|staking)\b/i.test(p.name))return 'Name signals a wrapped or staked product';
 if(/\s(?:v\d+(?:\.\d+)?|\d+\.\d+)$/i.test(p.name))return 'Versioned product';
 if(/^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i.test(p.name))return 'Exchange product';
 return null;
}
function tokenRecorded(p:any):boolean {
 return Boolean(p.symbol||p.gecko_id||p.mcap_usd>0);
}
function classification(p:any):any {
 if(tokenRecorded(p))return {status:'recorded_token',reason:'A ticker, CoinGecko ID or positive market cap is recorded.'};
 const reason=exclusion(p);
 if(reason)return {status:'excluded',reason};
 if(watch.has(p.slug))return {status:'watchlist',reason:'Included in the source watchlist.'};
 if(p.tvl_usd>=(snapshot.floor_usd||50000000))return {
  status:'lineage_review',
  reason:'At the watchlist floor but absent from its source list; parentProtocol is not in this snapshot.'
 };
 return {status:'discovery',reason:'No token identity is recorded; under the watchlist floor and not caught by the name/category screen.'};
}
const universe=snapshot.protocols.map((p:any)=>({protocol:p,...classification(p)}));
const auditCounts:any={};
for(const row of universe)auditCounts[row.status]=(auditCounts[row.status]||0)+1;
function categoryAction(category:string):string {
 const c=(category||'').toLowerCase();
 if(c.includes('lend'))return 'Read supply caps, utilization, collateral rules, liquidation thresholds, withdrawal delays and every fee; do not deposit or borrow.';
 if(c.includes('dex'))return 'Inspect the swap interface and its route, price impact, minimum received and fee schedule without approving a token or sending a swap.';
 if(c.includes('yield')||c.includes('farm'))return 'Read the strategy, underlying assets, withdrawal queue, deposit caps and fee schedule; do not deposit into a vault.';
 if(c.includes('curator'))return 'Identify the host lending market, curator mandate, accepted collateral and withdrawal controls; observe without providing liquidity.';
 if(c.includes('cdp'))return 'Read collateral ratios, liquidation penalties, debt costs and redemption rules; do not open a position.';
 if(c.includes('rwa'))return 'Verify issuer, legal eligibility, redemption process, custody and transfer restrictions before treating any campaign as accessible.';
 if(c.includes('derivative')||c.includes('basis'))return 'Read funding, liquidation, oracle and settlement rules; inspect the interface without opening a position.';
 if(c.includes('prediction'))return 'Read the resolution source, close time, dispute period and settlement rules; do not place a trade.';
 return 'Read the product, chain support, access restrictions and withdrawal rules; inspect its public interface without connecting funds.';
}
function farmSteps(p:any):string[] {
 const category=p.category||'Unclassified';
 const chain=(p.chains||[])[0]||'a supported network';
 return [
  'Verify '+p.name+' on its own documentation and official domain; this '+snapshot.as_of+' snapshot records no token, which is not proof. About 5 minutes, $0.',
  'Check the official app for a dated points, quest or eligibility page. Record only explicitly free actions and their terms; do not connect a wallet or deposit. About 5–10 minutes, $0.',
  'On '+chain+' ('+category+'), '+categoryAction(category)+' About 10 minutes, $0.',
  'Cross-check any contract address against the official documentation and note the date. Skip transfers, swaps, bridges, staking, signatures that grant spending rights and every action with a fee. About 5 minutes, $0.'
 ];
}
const candidates=universe.filter((u:any)=>u.status==='watchlist'||u.status==='discovery').map((u:any)=>u.protocol);
const modeled=candidates.map((p:any)=>{
 const value=Math.exp(model.predict(p));
 const peer=peerContext(p.category||'Unclassified');
 const age=ageDays(p);
 return {
  ...p,
  age_days:age,
  watchlist:watch.has(p.slug),
  implied_value_usd:Math.max(1,Math.min(100000000000000,Math.round(value))),
  implied_low_usd:Math.max(1,Math.min(100000000000000,Math.round(value/intervalFactor))),
  implied_high_usd:Math.max(1,Math.min(100000000000000,Math.round(value*intervalFactor))),
  uncertainty_factor:+intervalFactor.toFixed(2),
  model_name:chosen,
  model_slope:model.slope??model.parameters?.slope??null,
  peer_cap_tvl:peer.multiple,
  peer_count:peer.peer_count,
  token_record_share:+peer.token_record_share.toFixed(4),
  category_total:peer.category_total,
  farm_steps:farmSteps(p)
 };
}).sort((a:any,b:any)=>b.implied_value_usd-a.implied_value_usd||a.slug.localeCompare(b.slug))
 .map((p:any,index:number)=>({...p,rank:index+1}));
const live=comparable.sort((a:any,b:any)=>b.mcap_usd-a.mcap_usd).map((p:any)=>({
 name:p.name,slug:p.slug,symbol:p.symbol,mcap_usd:p.mcap_usd,tvl_usd:p.tvl_usd,
 category:p.category,chains:p.chains,cap_tvl:+(p.mcap_usd/p.tvl_usd).toFixed(4)
}));
const audit=universe.map((u:any)=>({
 slug:u.protocol.slug,name:u.protocol.name,category:u.protocol.category,
 tvl_usd:u.protocol.tvl_usd,status:u.status,reason:u.reason,
 symbol:u.protocol.symbol,gecko_id:u.protocol.gecko_id
}));
const report={
 snapshot_date:snapshot.as_of,
 snapshot_source:snapshot.source,
 protocol_count:snapshot.protocols.length,
 recorded_token_count:snapshot.protocols.filter(tokenRecorded).length,
 comparable_count:comparable.length,
 dated_comparable_count:dated.length,
 watchlist_count:snapshot.watchlist.length,
 candidate_count:modeled.length,
 audit_counts:auditCounts,
 selected_model:chosen,
 model_parameters:model.parameters||{slope:model.slope??null,intercept:model.intercept??null,coefficients:model.beta||[]},
 validation:validation,
 chosen_validation:validation.find(v=>v.name===chosen),
 interval_factor:+intervalFactor.toFixed(2),
 interpretation:'Cross-sectional market-cap scenario conditional on a token being issued; no issuance odds or timing are estimated. Validation is a historical, expanding-window fit on the same frozen snapshot.'
};
mkdirSync(out,{recursive:true});
writeFileSync(join(out,'board.json'),JSON.stringify({rows:modeled,model:report,universe:audit}));
const dashboardData={as_of:snapshot.as_of,source:snapshot.source,floor_usd:snapshot.floor_usd,summary:report,rows:modeled,live,universe:audit};
writeFileSync(join(out,'data.js'),'window.RADAR='+JSON.stringify(dashboardData)+';');
cpSync(join(base,'dashboard'),join(out,'dashboard'),{recursive:true});
cpSync(join(base,'screenshots'),join(out,'screenshots'),{recursive:true});
writeFileSync(join(out,'dossier.json'),buildDossier(out,{text_max_bytes:65536}));
console.log('Wrote '+modeled.length+' ranked candidates; audited '+audit.length+' protocols and covered '+snapshot.watchlist.length+' watchlist entries.');
console.log('Model '+chosen+'; validation cohorts '+dated.length+' dated comparables and '+modelMetrics(oof).n+' out-of-fold predictions.');
