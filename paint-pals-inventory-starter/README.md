# Paint Pals Inventory Starter

This is a Next.js starter project based on the real app prototype we built.

## Included
- premium mobile/tablet UI starter
- routes for dashboard, inventory, reorder, prices, team, settings
- van vs shop inventory
- reorder list
- supply cost tracking
- total inventory value
- Google Shopping launch-out for price checks
- Supabase starter client files

## Not live yet
- real Supabase auth wiring
- live database reads/writes
- realtime shared syncing
- push notifications
- automatic cheapest-price scanning

## Run locally
```bash
npm install
npm run dev
```

## Deploy to Vercel
1. Upload to GitHub
2. Import repo into Vercel
3. Add environment variables from `.env.example`

## Recommended next steps
1. Create Supabase project
2. Run `supabase-schema.sql`
3. Replace localStorage in `components/inventory-app.tsx` with Supabase
4. Add login and workspace membership
5. Add PWA manifest and install flow
