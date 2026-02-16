#!/usr/bin/env python3
import csv
from datetime import date
from pathlib import Path

base = Path('/Users/anton/marcus-lab/onchain-growth-audit')
lead_pool = base / 'sales' / 'lead_pool_protocols_top200.csv'
out = base / 'sales' / f'daily_targets_{date.today().isoformat()}.csv'

rows = list(csv.DictReader(lead_pool.open()))
# simple slice for daily execution
pick = rows[:40]

with out.open('w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=['name','slug','category','tvl_usd','chains','website','twitter'])
    w.writeheader(); w.writerows(pick)

print(out)
