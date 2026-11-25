// The separate market context never mixes observed token values into estimates.
// Create nodes rather than injecting protocol names as HTML.
const marketHost = document.getElementById('live-list');
const marketMore = document.getElementById('live-more');
let marketLimit = 5;

function cell(value, className) {
  const element = document.createElement('td');
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function paintMarket() {
  const table = document.createElement('table');
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const columns = ['Protocol', 'Recorded ticker', 'Category', 'TVL', 'Recorded market cap'];
  for (const label of columns) {
    const heading = document.createElement('th');
    heading.textContent = label;
    headerRow.append(heading);
  }
  head.append(headerRow);
  table.append(head);
  const body = document.createElement('tbody');
  const selected = window.RADAR.live.slice(0, marketLimit);
  for (const protocol of selected) {
    const row = document.createElement('tr');
    row.append(
      cell(protocol.name),
      cell(protocol.symbol || 'Not recorded'),
      cell(protocol.category || 'Unclassified'),
      cell(money(protocol.tvl_usd)),
      cell(money(protocol.mcap_usd), 'value')
    );
    body.append(row);
  }
  table.append(body);
  marketHost.replaceChildren(table);
  marketMore.hidden = marketLimit >= window.RADAR.live.length;
  if (selected.length === 0) {
    marketHost.textContent = 'No recorded market-cap data in this snapshot.';
  }
}

marketMore.addEventListener('click', () => {
  marketLimit += 10;
  paintMarket();
});

paintMarket();
