const data=window.RADAR;
const $=id=>document.getElementById(id);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:2}).format(Number(value)||0);
const percent=value=>value==null?'—':(value>=0?'+':'')+Number(value).toFixed(1)+'%';
const labelMap={size_curve:'Robust size curve',size_age:'TVL + age',size_growth:'TVL + weekly change',size_age_growth:'TVL + age + weekly change',size_category:'TVL + shrunken category residual',ratio:'Fixed cap / TVL multiple',flat:'Flat market-cap baseline'};
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
 $('model-summary').textContent=modelName+' selected from '+stats.dated_comparable_count+' dated records; '+stats.comparable_count+' positive cap / TVL peers train the final fit. Age and 7-day change are evaluated as terms and retained only when held-out error supports them.';
const parameters=stats.model_parameters||{};
const slope=parameters.slope;
$('formula').textContent=slope==null?'Robust scenario fit · '+modelName:'ln(market cap) = intercept + '+Number(slope).toFixed(3)+' × ln(TVL)';
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
 return '<tr class="'+(selected?'selected-model':'')+'"><td>'+escapeHtml(labelMap[row.name]||row.name)+(selected?' <span class="selected-tag">selected</span>':'')+'</td><td>'+Number(row.n).toLocaleString('en-US')+'</td><td>'+escapeHtml(row.median_factor_error)+'×</td><td>'+escapeHtml(row.within_2x_percent)+'%</td></tr>';
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
  return '<tr><td><span class="rank">'+String(row.rank).padStart(3,'0')+'</span><strong>'+escapeHtml(row.name)+'</strong><small>'+(row.watchlist?'Source watchlist':'Below-floor discovery')+' · '+escapeHtml(row.slug)+'</small></td>'+
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
 $('detail-lane').textContent=row.watchlist?'Source watchlist':'Below-floor discovery';
 const share=(100*row.token_record_share).toFixed(1);
 const peerText=row.peer_count+' recorded-token comparables in '+escapeHtml(row.category||'Unclassified');
 const byName=Object.fromEntries(stats.validation.map(item=>[item.name,item]));
 const curveError=byName.size_curve?.mae_log;
 const growthError=byName.size_growth?.mae_log;
 const ageError=byName.size_age?.mae_log;
 const combinedError=byName.size_age_growth?.mae_log;
 const validationNote=stats.selected_model==='size_curve'&&[curveError,growthError,ageError,combinedError].every(Number.isFinite)
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
  '<h3>Zero-spend research plan</h3><ol>'+(row.farm_steps||[]).map(step=>'<li>'+escapeHtml(step)+'</li>').join('')+'</ol>'+
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
