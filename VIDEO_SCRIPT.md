# VIDEO_SCRIPT.md — GROUNDS ≤5 minutes (click-through PRODUCT demo)

Target: micro1 deliverable. **Use the product** — clicks, filters, start run, gate decisions — not slides and not passive scroll.

## Deliverable

- **File:** `demo/GROUNDS_DEMO.mp4` (~1:54 click-through)
- **Re-render:** `VITE_GROUNDS_DEMO=1 npm run dev -- --port 8080` then `npm run demo:product`

## What the recording does

1. Home → Product (“See how it works”)
2. Dashboard overview (live metrics)
3. Claim packs: search `widget`, filter Mismatch → All, open C-001, Export
4. Trajectories scroll
5. Runs: toggle baseline/agent, Start run
6. Human gate: Approve + Deny pending actions
7. Evaluation table
8. Settings: policy toggle, Invite later (solo — not multi-tenant), key hygiene
9. Docs / changelog close

## Multi-tenant?

**Not for micro1.** Solo workspace is enough. Fake team-invite chrome removed; Settings says multi-tenant is post-contest.

## Must show

- Real clicks changing UI state (filters, toasts, gate queue shrinking)
- Live eval numbers
- No unhackable claims
- Under 5:00
