const data=window.RADAR;
const $=id=>document.getElementById(id);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(Number(value)||0);
const percent=value=>value==null?'—':(value>=0?'+':'')+Number(value).toFixed(1)+'%';
const labelMap={size_curve:'Robust size curve',size_age:'TVL + age',size_growth:'TVL + weekly change',size_age_growth:'TVL + age + weekly change',size_blend_growth_25:'75% size curve + 25% growth fit',size_blend_growth_50:'50% size curve + 50% growth fit',size_blend_age_growth_10:'90% size curve + 10% age / growth fit',size_blend_age_growth_15:'85% size curve + 15% age / growth fit',size_blend_age_growth_20:'80% size curve + 20% age / growth fit',size_blend_age_growth_25:'75% size curve + 25% age / growth fit',size_blend_age_growth_50:'50% size curve + 50% age / growth fit',size_category:'TVL + shrunken category residual',ratio:'Fixed cap / TVL multiple',flat:'Flat market-cap baseline'};
const planOverrides={
 'veda':{
  title:'Vault points: $0 eligibility check',
  status:'Veda is vault infrastructure. Its public vault UI can show partner points, while the documented user actions center on depositing and withdrawing assets; no capital-free points route is verified here.',
  source:'Checked 2026-11-26 · docs.veda.tech/security-and-risk-controls/smart-contract-security · app.veda.tech',
  steps:[
   'Open Veda Earn and scan only the public vault rows marked with points. Record the vault, partner, supported asset, chain, campaign end date and eligibility terms without connecting a wallet. 5 minutes, $0.',
   'Open the vault terms in Veda’s official docs and note deposit requirements, share-lock period, withdrawal delay and fees. Treat a points label as a capital route unless its terms explicitly say otherwise. 5 minutes, $0.',
   'Veda documents deposit and withdrawal as the vault interaction. Do not approve, deposit or sign; the deposit would require assets and network gas, so it is outside a $0 plan. 4 minutes, $0.',
   'Recheck that same vault’s published campaign next week. Record “no verified $0 route” unless an official term adds an accountless, no-fee action. 2 minutes, $0.'
  ]
 },
 'gauntlet':{
  title:'Curated vaults: $0 risk review',
  status:'Gauntlet-branded vaults deploy user assets and carry principal risk; its public disclaimer also describes possible withdrawal timelocks. No accountless reward route is verified in the reviewed terms.',
  source:'Checked 2026-11-26 · storage.googleapis.com/gauntlet-public-web-assets/gauntlet-branded-vault-disclaimer-dec-2025.pdf',
  steps:[
   'Open Gauntlet’s public vault list and identify the named market, collateral asset, network and curator. Read the listing without connecting a wallet. 5 minutes, $0.',
   'Read the linked vault disclosure for performance fees, withdrawal notice, lock period and loss/liquidation risk before considering any route. 5 minutes, $0.',
   'A vault position requires deploying an asset and paying network gas; this is neither a $0 task nor a guaranteed reward. Do not approve, supply or sign. 3 minutes, $0.',
   'Recheck official terms weekly. Record a free route only if a published campaign explicitly permits an accountless, no-fee action; otherwise record “no verified $0 route.” 2 minutes, $0.'
  ]
 },
 'rockawayx':{
  title:'Curated vaults: $0 eligibility check',
  status:'RockawayX’s own vault launch guide says users deposit USDC or wETH and receive vault shares; redemption depends on liquidity across underlying markets. That is a funded yield position, not a capital-free farm.',
  source:'Checked 2026-11-26 · rockawayx.com/insights/rockawayx-launches-three-curated-vaults-on-morpho · docs.morpho.org/get-started/resources/apps/vault',
  steps:[
   'Open RockawayX’s public Morpho curator page and record the vault, chain, accepted asset, current exposure, available liquidity and curator fee. Read without connecting a wallet. 5 minutes, $0.',
   'Read RockawayX’s vault guide and Morpho’s vault instructions. Compare the collateral markets and redemption conditions; note that exits depend on liquidity across the underlying markets. 5 minutes, $0.',
   'The documented route deposits USDC or wETH and incurs network costs; it can lose principal. With a $0 budget, do not approve, deposit or sign. 3 minutes, $0.',
   'Recheck official campaign terms next week. Count a route only if a published offer adds a no-wallet, no-fee task; otherwise record “no verified $0 route.” 2 minutes, $0.'
  ]
 },
 'hyperithm':{
  title:'Curated vaults: $0 eligibility check',
  status:'Morpho’s official curator page lists Hyperithm vaults, while its vault guide says users deposit an asset to earn the curator-managed strategy yield. No capital-free reward route is verified.',
  source:'Checked 2026-11-26 · app.morpho.org/curator/hyperithm · docs.morpho.org/get-started/resources/apps/vault',
  steps:[
   'Open Hyperithm’s official Morpho curator page and record each vault’s network, deposit asset, curator and current market exposure. Do not connect a wallet. 5 minutes, $0.',
   'Use Morpho’s vault guide to check the market risk, fee and withdrawal conditions for the selected vault. Treat any token reward as conditional on its published funded position. 5 minutes, $0.',
   'Vault yield requires an asset deposit and network transaction. Under a $0 plan, do not approve, supply or sign; record the vault as capital-gated. 3 minutes, $0.',
   'Recheck the official curator page weekly for a separately documented free task. If none is listed, record “no verified $0 route.” 2 minutes, $0.'
  ]
 },
 'usdd':{
  title:'Existing token: $0 status check',
  rowTag:'Existing stablecoin · snapshot identity gap',
  status:'USDD’s official docs describe an issued stablecoin, although this frozen DefiLlama row has no token identity. Keep it as a snapshot data-gap case, not an unissued-token lead.',
  source:'Checked 2026-11-26 · docs.usdd.io/introduction · docs.usdd.io/user-guide/usdd-savings · docs.usdd.io/user-guide/psm-peg-stability-module',
  steps:[
   'Compare the frozen row with USDD’s current official introduction: it describes USDD as a stablecoin. Mark the missing snapshot token fields as a data gap and remove USDD from any live pre-token shortlist. 3 minutes, $0.',
   'Read the USDD Savings guide. Its earn route connects a wallet and deposits USDD to mint sUSDD, so it needs token principal and a transaction; it is not a free farm. 3 minutes, $0.',
   'Read the PSM guide before considering an exchange route: “zero fee” still requires stablecoins and network gas. With a $0 budget, do not connect, swap or sign. 3 minutes, $0.',
   'Check official announcements weekly for an accountless, no-fee activity. Until terms document one, record “no verified $0 route”; no yield or reward is promised. 2 minutes, $0.'
  ]
 },
 'upshift':{
  title:'Points route: deposit required',
  status:'Upshift’s official guide says users deposit supported assets into vaults and receive shares; strategy rewards or points accrue to that funded route. No capital-free farming path is verified.',
  source:'Checked 2026-11-26 · docs.upshift.finance/introduction/how-it-works · docs.upshift.finance/rest-api/institutional',
  steps:[
   'Open Upshift’s public vault list and read the points or reward configuration for each candidate vault. Note asset, chain, curator, fees, withdrawal terms and campaign end date; do not connect a wallet. 5 minutes, $0.',
   'The official flow starts with depositing a supported asset and receiving vault shares. Treat points tied to that position as requiring principal, execution gas and market-risk acceptance. 3 minutes, $0.',
   'Read the selected vault’s fee, allocation and redemption information before classifying it. With no capital, stop at the public research step; do not approve or deposit. 5 minutes, $0.',
   'Recheck the official campaign terms next week. Count a route only if the terms explicitly add a free, no-wallet task; otherwise record “no verified $0 route.” 2 minutes, $0.'
  ]
 },
 'opentrade':{
  title:'RWA vaults: $0 terms check',
  status:'OpenTrade describes yield vaults backed by portfolios of money-market, treasury, bond-fund or onchain assets; liquidity terms vary by vault. The published product is a funded yield route, not a verified free task.',
  source:'Checked 2026-11-26 · opentrade.io/vaults',
  steps:[
   'Open OpenTrade’s public vault catalogue and record each vault’s strategy, currency, risk description and liquidity terms. Keep the review read-only; do not connect a wallet. 5 minutes, $0.',
   'For a candidate vault, read the official terms for underlying assets, fees and redemption timing. The site says vault rates vary with the portfolio and some products use notice periods. 5 minutes, $0.',
   'Earning through a vault requires a funded balance and may involve product eligibility. With a $0 budget, do not subscribe, transfer assets or sign. 3 minutes, $0.',
   'Recheck the official catalogue next week. Record “no verified $0 route” unless OpenTrade publishes an accountless, no-fee task. 2 minutes, $0.'
  ]
 },
 'onre':{
  title:'Points route: ONyc exposure required',
  rowTag:'ONyc asset · protocol token unverified',
  status:'OnRe’s official docs describe ONyc as a yield-bearing asset and award points for holding or deploying ONyc. That product asset does not by itself prove a separate governance token; earning points still requires funded exposure.',
  source:'Checked 2026-11-26 · docs.onre.finance/onyc-in-defi/onre-points-program · docs.onre.finance/legal',
  steps:[
   'Read OnRe’s Points Program and note its daily snapshot time, base holding rate, partner multipliers and campaign terms. The official formula uses ONyc balance and time; review it without connecting a wallet. 5 minutes, $0.',
   'Check each supported venue’s current terms, chain, fees, KYC/eligibility rules and redemption path. The docs identify ONyc as a yield-bearing asset; do not confuse it with proof of a separate protocol-governance token. 5 minutes, $0.',
   'Points require holding or deploying ONyc, so the documented route requires capital and gas; leveraged or LP multipliers add risk. Do not buy, deposit, borrow or sign. 3 minutes, $0.',
   'Recheck the official points terms next week. Record “no verified $0 route” unless a published campaign adds a no-wallet task; do not promise points or a future reward. 2 minutes, $0.'
  ]
 },
 'curvance':{
  title:'Rewards: verify terms before any action',
  status:'Curvance’s general Rewards Terms say programs can require specified balances, activities or verification; rewards may have no cash value and may be changed or suspended. No accountless, no-fee route is verified here.',
  source:'Checked 2026-11-26 · curvance.com/terms-of-use · curvance.com',
  steps:[
   'Open Curvance’s official Rewards Terms and the current program page. Record the specific campaign, eligibility, minimum balance or activity, end date and regional restrictions. 5 minutes, $0.',
   'Check whether the chosen task is an offchain, no-wallet action. The general terms do not promise cash value; read any campaign-specific terms before treating it as a reward. 4 minutes, $0.',
   'If the campaign requires supplying, borrowing, a balance, gas or a signature, it cannot be completed at $0. Do not connect, approve, deposit or sign. 3 minutes, $0.',
   'Recheck official terms weekly; record “no verified $0 route” until a specific free action is published. 2 minutes, $0.'
  ]
 },
 'symbiotic':{
  title:'Points route: collateral required',
  status:'Symbiotic’s official points terms tie points to vault collateral deposits and, in Season 2, delegation to secure networks. No $0 points route is documented.',
  source:'Checked 2026-11-26 · docs.symbiotic.fi/get-started/resources/points-program · docs.symbiotic.fi/learn/core-concepts/vault',
  steps:[
   'Read the official Points Program terms and note which vaults and networks qualify, the current season rules and any cutoff. Points are calculated from collateral allocated to adapters; do not treat a public points page as a free task. 5 minutes, $0.',
   'For each qualifying vault, read its collateral token, access policy, epoch length, slashing rules and withdrawal timing. The vault docs say collateral is deposited and may remain slashable until the next epoch boundary. 6 minutes, $0.',
   'Points require collateral; delegation and points viewing may also require a connected wallet. With a $0 budget, do not connect, deposit, delegate or sign. 2 minutes, $0.',
   'Recheck the official season terms next week and record “no verified $0 route” unless a documented accountless task appears. 2 minutes, $0.'
  ]
 },
 'bittensor-dtao':{
  title:'Existing subnet tokens: $0 status check',
  rowTag:'Subnet alpha tokens exist · snapshot gap',
  status:'Bittensor documentation describes TAO and a distinct alpha token for each subnet. Staking dTAO swaps TAO for subnet alpha, so this row is not an unissued-token farm.',
  source:'Checked 2026-11-26 · bittensor.com/docs/concepts/emissions · bittensor.com/docs/concepts/staking-pools',
  steps:[
   'Read the official emissions guide and identify the subnet’s alpha token alongside TAO. The frozen snapshot’s blank token fields do not establish that this network has no token; mark it “existing token system.” 4 minutes, $0.',
   'Read the staking-pools guide to see how staking swaps TAO for subnet alpha and exposes the position to pool price and fees. This route needs capital and is not free farming. 4 minutes, $0.',
   'For a $0 plan, review the public subnet and emissions tables only. Do not stake, trade, register a subnet or sign a transaction. 5 minutes, $0.',
   'Check official emissions and network notices weekly for a documented accountless task. Otherwise record “no verified $0 route” and exclude it from unissued-token leads. 2 minutes, $0.'
  ]
 }
};
let limit=10;
let auditLimit=20;

$('date').textContent=data.as_of;
$('method-date').textContent=data.as_of;
const stats=data.summary;
const decisions=stats.audit_counts;
$('metrics').innerHTML=[
 ['Protocols scanned',stats.protocol_count,'Every protocol in the frozen input'],
 ['Research candidates',stats.candidate_count,'Ranked by scenario market cap'],
 ['Source watchlist',stats.watchlist_count,'All source-list entries retained'],
 ['Token peers',stats.comparable_count,'Positive cap and TVL records']
].map(([title,value,note])=>'<article class="metric-card"><span>'+escapeHtml(title)+'</span><strong>'+Number(value).toLocaleString('en-US')+'</strong><small>'+escapeHtml(note)+'</small></article>').join('');
$('audit-summary').innerHTML=[
 ['Watchlist',decisions.watchlist||0,'watchlist'],
 ['Below-floor discovery',decisions.discovery||0,'discovery'],
 ['Lineage review',decisions.lineage_review||0,'lineage_review'],
 ['Token recorded',decisions.recorded_token||0,'recorded_token'],
 ['Screened out',decisions.excluded||0,'excluded']
].map(([label,value,key])=>'<button class="audit-chip" data-audit="'+key+'"><span>'+escapeHtml(label)+'</span><strong>'+Number(value).toLocaleString('en-US')+'</strong></button>').join('');
const networks=[...new Set(data.rows.flatMap(row=>row.chains||[]))].sort((a,b)=>a.localeCompare(b));
for(const network of networks){const option=document.createElement('option');option.value=network;option.textContent=network;$('chain').append(option)}
for(const category of [...new Set(data.rows.map(row=>row.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b))){
 const option=document.createElement('option');option.value=category;option.textContent=category;$('category').append(option)
}
const modelName=labelMap[stats.selected_model]||stats.selected_model;
$('model-summary').textContent=modelName+' selected from '+stats.dated_comparable_count+' dated records; '+stats.comparable_count+' positive cap / TVL peers train the final fit. A conservative age / growth blend is retained only when its held-out error stays within 0.03 of the best fit.';
const parameters=stats.model_parameters||{};
const slope=parameters.slope;
$('formula').textContent=Array.isArray(parameters.fields)?'Blended robust fit · '+modelName+' · '+Math.round(Number(parameters.blend_weight)*100)+'% age / growth adjustment':slope==null?'Robust scenario fit · '+modelName:'ln(market cap) = intercept + '+Number(slope).toFixed(3)+' × ln(TVL)';
if(Array.isArray(parameters.fields)&&parameters.fields.includes('age')&&parameters.fields.includes('growth')){
 const coefficients=parameters.coefficients||[],weight=Number(parameters.blend_weight)||0;
 $('formula-note').textContent='ln(MCap) blends '+(1-weight).toFixed(2)+' × size curve with '+weight.toFixed(2)+' × Huber(TVL, age, 7d change). Age is centered ln(1 + tracking days / 365); weekly change is clipped to −50%…+100%, scaled and centered. Shrunken feature weights: age '+(weight*Number(coefficients[2]||0)).toFixed(4)+', weekly change '+(weight*Number(coefficients[3]||0)).toFixed(4)+' per 100%.';
}else $('formula-note').textContent='Age and 7-day change remain visible in the detail view; expanding-window validation keeps them out when they do not improve the selected fit.';
$('hero-model').textContent=modelName;
const leadScenario=data.rows[0];
if(leadScenario){
 $('signal-name').textContent=leadScenario.name;
 $('signal-value').textContent=money(leadScenario.implied_value_usd);
 $('signal-range').textContent=money(leadScenario.implied_low_usd)+'–'+money(leadScenario.implied_high_usd)+' · 80% residual interval';
}
function renderHeroChart(){
 const peers=data.live.filter(row=>row.tvl_usd>0&&row.mcap_usd>0);
 const scenarios=data.rows.slice(0,40).filter(row=>row.tvl_usd>0&&row.implied_value_usd>0);
 const points=[...peers.map(row=>[Math.log(row.tvl_usd),Math.log(row.mcap_usd)]),...scenarios.map(row=>[Math.log(row.tvl_usd),Math.log(row.implied_value_usd)])];
 if(!points.length)return;
 const width=520,height=152,left=47,right=508,top=14,bottom=105;
 const xMin=Math.min(...points.map(point=>point[0]))-.22,xMax=Math.max(...points.map(point=>point[0]))+.22;
 const yMin=Math.min(...points.map(point=>point[1]))-.38,yMax=Math.max(...points.map(point=>point[1]))+.38;
 const x=value=>left+(value-xMin)/(xMax-xMin)*(right-left);
 const y=value=>bottom-(value-yMin)/(yMax-yMin)*(bottom-top);
 const clamp=value=>Math.max(top,Math.min(bottom,value));
 const xTicks=[0,.5,1].map(fraction=>xMin+(xMax-xMin)*fraction);
 const yTicks=[0,1,2,3].map(index=>yMin+(yMax-yMin)*index/3);
 const gridX=xTicks.map(value=>'<line class="chart-grid" x1="'+x(value)+'" y1="'+top+'" x2="'+x(value)+'" y2="'+bottom+'"/><text class="chart-label" x="'+x(value)+'" y="'+(bottom+13)+'" text-anchor="middle">'+escapeHtml(money(Math.exp(value)))+'</text>').join('');
 const gridY=yTicks.map(value=>'<line class="chart-grid" x1="'+left+'" y1="'+y(value)+'" x2="'+right+'" y2="'+y(value)+'"/><text class="chart-label" x="'+(left-8)+'" y="'+(y(value)+3)+'" text-anchor="end">'+escapeHtml(money(Math.exp(value)))+'</text>').join('');
 const fitSlope=Number(parameters.slope),fitIntercept=Number(parameters.intercept);
 let fit='',band='';
 if(Number.isFinite(fitSlope)&&Number.isFinite(fitIntercept)){
  const xs=Array.from({length:28},(_,index)=>xMin+(xMax-xMin)*index/27);
  fit='<path class="chart-fit" d="'+xs.map((value,index)=>(index?'L':'M')+x(value).toFixed(1)+' '+y(fitIntercept+fitSlope*value).toFixed(1)).join(' ')+'"/>';
  const offset=Math.log(Math.max(1,Number(stats.interval_factor)||1));
  const upper=xs.map(value=>x(value).toFixed(1)+','+clamp(y(fitIntercept+fitSlope*value+offset)).toFixed(1));
  const lower=[...xs].reverse().map(value=>x(value).toFixed(1)+','+clamp(y(fitIntercept+fitSlope*value-offset)).toFixed(1));
  band='<polygon class="chart-band" points="'+[...upper,...lower].join(' ')+'"/>';
 }
 const peerDots=peers.map(row=>'<circle class="peer-dot" cx="'+x(Math.log(row.tvl_usd)).toFixed(1)+'" cy="'+y(Math.log(row.mcap_usd)).toFixed(1)+'" r="2.6"/>').join('');
 const candidateDots=scenarios.map(row=>'<circle class="candidate-dot" cx="'+x(Math.log(row.tvl_usd)).toFixed(1)+'" cy="'+y(Math.log(row.implied_value_usd)).toFixed(1)+'" r="3.2"><title>'+escapeHtml(row.name)+' · conditional '+escapeHtml(money(row.implied_value_usd))+'</title></circle>').join('');
 $('hero-chart').innerHTML='<svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Observed token peers and conditional candidate values plotted on logarithmic TVL and market-cap axes"><g>'+gridX+gridY+'<line class="chart-axis" x1="'+left+'" y1="'+bottom+'" x2="'+right+'" y2="'+bottom+'"/><line class="chart-axis" x1="'+left+'" y1="'+top+'" x2="'+left+'" y2="'+bottom+'"/><g>'+band+fit+peerDots+candidateDots+'</g><text class="chart-axis-title" x="'+((left+right)/2)+'" y="147" text-anchor="middle">TVL · LOG SCALE</text></g></svg><div class="chart-legend"><span><i class="legend-peer"></i>Observed token peer</span><span><i class="legend-candidate"></i>Candidate scenario</span><span><i class="legend-fit"></i>Robust fit</span></div>';
}
renderHeroChart();
$('validation-rows').innerHTML=stats.validation.map(row=>{
 const selected=row.name===stats.selected_model;
 return '<tr class="'+(selected?'selected-model':'')+'"><td>'+escapeHtml(labelMap[row.name]||row.name)+(selected?' <span class="selected-tag">selected</span>':'')+'</td><td>'+Number(row.n).toLocaleString('en-US')+'</td><td>'+Number(row.mae_log).toFixed(2)+'</td><td>'+escapeHtml(row.median_factor_error)+'×</td><td>'+escapeHtml(row.within_2x_percent)+'%</td></tr>';
}).join('');

function visibleRows(){
 const query=$('search').value.toLowerCase().trim();
 const coverage=$('coverage').value;
 const chain=$('chain').value;
 const category=$('category').value;
 const rows=data.rows.filter(row=>
  (!query||[row.name,row.slug,row.category,...(row.chains||[])].some(value=>String(value??'').toLowerCase().includes(query)))&&
  (coverage==='all'||(coverage==='watch'?row.watchlist:!row.watchlist))&&
  (chain==='all'||(row.chains||[]).includes(chain))&&
  (category==='all'||row.category===category)
 );
 const sort=$('sort').value;
 const get={tvl:'tvl_usd',growth:'change_7d',age:'age_days',prevalence:'token_record_share'}[sort];
 return rows.sort((a,b)=>{
  if(sort==='name')return a.name.localeCompare(b.name);
  if(sort==='value')return a.rank-b.rank;
  return (b[get]??-Infinity)-(a[get]??-Infinity)||a.rank-b.rank;
 });
}
function chainLabel(row){
 const selected=$('chain').value;
 const list=row.chains||[];
 const primary=selected!=='all'&&list.includes(selected)?selected:(list[0]||'Not recorded');
 return {primary,extras:Math.max(0,list.length-1),full:list.join(', ')};
}
function renderBoard(){
 const rows=visibleRows();
 const sortLabel=$('sort').selectedOptions[0].textContent.toLowerCase();
 $('count').textContent=rows.length+' protocols · view sorted by '+sortLabel;
 $('rows').innerHTML=rows.slice(0,limit).map(row=>{
  const network=chainLabel(row);
  const share=(100*row.token_record_share).toFixed(0)+'%';
  const reviewTag=planOverrides[row.slug]?.rowTag||(planOverrides[row.slug]?'Official terms reviewed':'');
  return '<tr><td><span class="rank">'+String(row.rank).padStart(3,'0')+'</span><strong>'+escapeHtml(row.name)+'</strong><small>'+(row.watchlist?'Source watchlist':'Below-floor discovery')+(reviewTag?' · '+escapeHtml(reviewTag):'')+' · '+escapeHtml(row.slug)+'</small></td>'+
   '<td>'+escapeHtml(row.category||'Unclassified')+'</td><td title="'+escapeHtml(network.full)+'"><span class="tag">'+escapeHtml(network.primary)+(network.extras?' +'+network.extras:'')+'</span></td>'+
   '<td>'+money(row.tvl_usd)+'</td><td class="value">'+money(row.implied_value_usd)+'<small>'+money(row.implied_low_usd)+'–'+money(row.implied_high_usd)+' interval</small></td>'+
   '<td>'+share+'<small>category record share</small></td><td>'+percent(row.change_7d)+'</td>'+
   '<td><button class="open" data-slug="'+escapeHtml(row.slug)+'" aria-label="Open '+escapeHtml(row.name)+' details">↗</button></td></tr>';
 }).join('');
 $('empty').hidden=rows.length>0;
 $('more').hidden=rows.length<=limit;
}
function renderAudit(){
 const query=$('audit-search').value.toLowerCase().trim(),filter=$('audit-filter').value;
 const rows=data.universe.filter(row=>(filter==='all'||row.status===filter)&&
  (!query||[row.name,row.slug,row.category,row.reason,row.symbol,row.gecko_id].some(value=>String(value??'').toLowerCase().includes(query))));
 $('audit-count').textContent=rows.length.toLocaleString('en-US')+' of '+data.universe.length.toLocaleString('en-US')+' protocols';
 $('audit-rows').innerHTML=rows.slice(0,auditLimit).map(row=>{
  const token=row.status==='recorded_token'?(row.symbol||row.gecko_id||'Token record'):'';
  return '<tr><td><strong>'+escapeHtml(row.name)+'</strong><small>'+escapeHtml(row.slug)+'</small></td><td>'+escapeHtml(row.category||'Unclassified')+'</td>'+
   '<td>'+money(row.tvl_usd)+'</td><td><span class="status '+escapeHtml(row.status)+'">'+escapeHtml(row.status.replaceAll('_',' '))+'</span>'+(token?'<small>'+escapeHtml(token)+'</small>':'')+'</td><td class="reason">'+escapeHtml(row.reason)+'</td></tr>';
 }).join('');
 $('audit-empty').hidden=rows.length>0;
 $('audit-more').hidden=rows.length<=auditLimit;
}
function detail(slug){
 const row=data.rows.find(item=>item.slug===slug);
 if(!row)return;
 const plan=planOverrides[row.slug];
 $('detail-lane').textContent=row.watchlist?'Source watchlist':'Below-floor discovery';
 const share=(100*row.token_record_share).toFixed(1);
 const peerText=row.peer_count+' recorded-token comparables in '+escapeHtml(row.category||'Unclassified');
 const byName=Object.fromEntries(stats.validation.map(item=>[item.name,item]));
 const curveError=byName.size_curve?.mae_log;
 const growthError=byName.size_growth?.mae_log;
 const ageError=byName.size_age?.mae_log;
 const combinedError=byName.size_age_growth?.mae_log;
 const gap=stats.chosen_validation.mae_log-Math.min(...stats.validation.filter(item=>item.name!=='flat').map(item=>item.mae_log));
 const validationNote=stats.selected_model.startsWith('size_blend_age_growth_')
  ?'The selected value blends a robust fit on TVL, tracking age and 7-day change with the size curve at '+Math.round(Number(stats.model_parameters.blend_weight)*100)+'% weight. Its mean absolute log error is '+Number(stats.chosen_validation.mae_log).toFixed(2)+', '+gap.toFixed(3)+' above the best fit and inside the 0.03 tolerance.'
  :stats.selected_model==='size_curve'&&[curveError,growthError,ageError,combinedError].every(Number.isFinite)
   ?'Across '+stats.chosen_validation.n+' out-of-fold records, the size curve had '+Number(curveError).toFixed(2)+' mean absolute log error; adding weekly change scored '+Number(growthError).toFixed(2)+', age '+Number(ageError).toFixed(2)+', and both '+Number(combinedError).toFixed(2)+'. The selected value therefore uses TVL without an unsupported age or growth premium.'
   :'The validation table shows how age and weekly change affected held-out fit; the selected model uses only the terms its out-of-fold results support.';
 $('detail-content').innerHTML='<h2 class="detail-title">'+escapeHtml(row.name)+'</h2>'+
  '<p class="detail-copy">'+escapeHtml(row.category||'Unclassified')+' · '+escapeHtml((row.chains||[]).join(', ')||'Network not recorded')+' · snapshot '+escapeHtml(data.as_of)+'</p>'+
  '<div class="detail-metrics"><div><span>Scenario market cap</span><strong>'+money(row.implied_value_usd)+'</strong></div>'+
  '<div><span>80% residual interval</span><strong>'+money(row.implied_low_usd)+'–'+money(row.implied_high_usd)+'</strong></div>'+
  '<div><span>TVL</span><strong>'+money(row.tvl_usd)+'</strong></div>'+
  '<div><span>7-day TVL change</span><strong>'+percent(row.change_7d)+'</strong></div>'+
  '<div><span>Category comparables</span><strong>'+row.peer_count+'</strong></div>'+
  '<div><span>Token-record share</span><strong>'+share+'%</strong></div>'+
  '<div><span>Tracking age</span><strong>'+(row.age_days==null?'Unknown':row.age_days+' days')+'</strong></div></div>'+
  '<section class="detail-copy"><h3>How to read the value</h3><p>'+escapeHtml(labelMap[row.model_name]||row.model_name)+' fit on '+escapeHtml(String(stats.comparable_count))+' protocols with a token identity, positive market cap and positive TVL. The category ratio '+Number(row.peer_cap_tvl).toFixed(2)+'× is shown as context; the fitted value uses the selected model.</p><p>'+escapeHtml(validationNote)+'</p>'+
  '<p>The '+share+'% figure is the share of snapshot records in this category with a token identity. It is not a probability that this protocol will issue one. The snapshot carries no launch outcome or eligibility labels.</p>'+
  '<h3>'+escapeHtml(plan?.title||'Zero-spend research plan')+'</h3>'+(plan?'<p class="plan-status">'+escapeHtml(plan.status)+'<br><small>Official references, checked '+escapeHtml(plan.source.slice('Checked 2026-11-26 · '.length))+'</small></p>':'')+'<ol>'+(plan?.steps||row.farm_steps||[]).map(step=>'<li>'+escapeHtml(step)+'</li>').join('')+'</ol>'+
  '<p class="notice">The snapshot records no token identity for this protocol. Verify its current status. No points, airdrop or reward is promised; every action requiring a transfer, spending signature or fee is out of scope.</p></section>';
 $('detail').showModal();
}
$('rows').addEventListener('click',event=>{const button=event.target.closest('[data-slug]');if(button)detail(button.dataset.slug)});
$('audit-summary').addEventListener('click',event=>{const button=event.target.closest('[data-audit]');if(button){$('audit-filter').value=button.dataset.audit;$('audit-search').value='';auditLimit=20;$('audit-rows').closest('details').open=true;renderAudit()}});
for(const id of ['coverage','chain','category','sort'])$(id).addEventListener('change',()=>{limit=10;renderBoard()});
$('search').addEventListener('input',()=>{limit=10;renderBoard()});
$('more').addEventListener('click',()=>{limit+=20;renderBoard()});
$('audit-filter').addEventListener('change',()=>{auditLimit=20;renderAudit()});
$('audit-search').addEventListener('input',()=>{auditLimit=20;renderAudit()});
$('audit-more').addEventListener('click',()=>{auditLimit+=40;renderAudit()});
$('close').addEventListener('click',()=>$('detail').close());
renderBoard();
renderAudit();
