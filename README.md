# Atlas: launch research

[![make.fun bounty](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![Rank](https://make.fun/badge/token-radar-01/david05klai/makefun-radar-atlas/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard)
[![Reward](https://make.fun/badge/token-radar-01/david05klai/makefun-radar-atlas/reward.svg)](https://make.fun/bounty/token-radar-01)

Atlas builds an offline research dashboard from the competition's sealed DefiLlama snapshot. Its transparent scenario model uses TVL, weekly change and tracking age. A missing recorded token is not proof of token status; the displayed value is not a forecast.

Run with Node 22.18 or newer:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input /path/to/snapshot.json
```

Open `out/dashboard/index.html` after the program runs. Data and estimates are historical and not investment advice; research and any on-chain interactions carry risk and costs.
