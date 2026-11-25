const marketHost=document.getElementById('live-list');
const marketMore=document.getElementById('live-more');
let marketLimit=8;

function cell(value,className){
 const element=document.createElement('td');
 element.textContent=value;
 if(className)element.className=className;
 return element;
}
function paintMarket(){
 const table=document.createElement('table');
 const header=document.createElement('thead');
 const heading=document.createElement('tr');
 for(const label of ['Protocol','Recorded ticker','Category','TVL','Market cap','Cap / TVL']){
  const th=document.createElement('th');th.textContent=label;heading.append(th);
 }
 header.append(heading);table.append(header);
 const body=document.createElement('tbody');
 for(const row of window.RADAR.live.slice(0,marketLimit)){
  const tr=document.createElement('tr');
  tr.append(
   cell(row.name),
   cell(row.symbol||row.gecko_id||'Not recorded'),
   cell(row.category||'Unclassified'),
   cell(money(row.tvl_usd)),
   cell(money(row.mcap_usd),'value'),
   cell(Number(row.cap_tvl).toFixed(2)+'×')
  );
  body.append(tr);
 }
 table.append(body);marketHost.replaceChildren(table);
 marketMore.hidden=marketLimit>=window.RADAR.live.length;
}
marketMore.addEventListener('click',()=>{marketLimit+=12;paintMarket()});
paintMarket();
