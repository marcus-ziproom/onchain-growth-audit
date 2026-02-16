# USDC Settlement SOP

## Intake to Payment Flow
1. Lead qualifies
2. Send intake confirmation
3. Issue USDC payment instruction
4. Confirm settlement on-chain
5. Mark project as PAID in pipeline
6. Start 48h timer

## Message Template
"Thanks — we’re ready to proceed. Settlement for the 48-hour audit is $1,200 USDC.
Please send to: {WALLET_ADDRESS}
Network: {NETWORK}
After sending, reply with tx hash to start delivery window."

## Controls
- Never move funds without explicit user authorization
- Keep tx hash + timestamp in pipeline notes
- Reconcile daily
