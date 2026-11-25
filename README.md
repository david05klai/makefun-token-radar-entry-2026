# Atlas: pre-token research

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/david05klai/makefun-token-radar-entry-2026/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/david05klai/makefun-token-radar-entry-2026/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Evidence-fit launch-value scenarios from a sealed protocol snapshot, with uncertainty bands, historical validation, and a complete source-row audit. Built for make.fun's “Build the best token launch radar” bounty.

Atlas scans the competition's sealed DefiLlama snapshot and ranks protocols by a conditional market-cap scenario: what the snapshot's cross-sectional size curve implies if a token is issued. The task does not ask for launch odds or timing, so Atlas estimates neither.

## What it shows

- A ranked research board for every source-watchlist protocol and eligible below-floor discoveries.
- A log-scale chart plots all 128 observed token peers, the top 40 candidate scenarios, the fitted size curve and its held-out residual band.
- A line-by-line audit of all 758 source records, including recorded tokens, screened categories and high-TVL records omitted by the source watchlist whose parent link is unavailable in this snapshot.
- A robust log-market-cap versus log-TVL curve fitted to 128 token records with positive market cap and TVL.
- Expanding-window comparisons against a fixed multiple and variants that add age, weekly change or category residuals. Only the simplest size curve is kept when extra terms fail to improve out-of-fold error.
- A wide residual interval, because this one-snapshot model is uncertain; category token-record share is descriptive and never presented as launch probability.
- A category-aware research plan with $0 budget. It tells readers to skip transfers, spending signatures and fees.

The input is frozen at 2026-11-14. “No token recorded” describes that source record only; it is not proof of current token status. Values are not token-price, airdrop or eligibility forecasts.

## Run

    MAKEFUN_OUTPUT_DIR=out node main.ts --input /path/to/snapshot.json

Open out/dashboard/index.html locally. The generated dashboard has no network dependency.

## Validation snapshot

The expanding-window model selection covered 45 out-of-fold observations from 95 records with a tracking date. On those folds, the selected curve had a median absolute factor error of 2.8× and landed within 2× on 28.9% of observations. Those metrics are shown in the dashboard and are not a guarantee for a future token.
