# Fix GSC 404s (5,104 "Not found" pages) — 2026-09-24

## Findings
- All 6,473 URLs with search impressions (Jan–Sep 2026) return 200 today. The 404s are URLs Google found via internal links / old sitemap that never got impressions.
- Root cause 1: city pages link to every specialty present in the city (even 1 provider), but `/[state]/[city]/specialties/[specialty]` 404s below 2 providers → ~7,996 broken internal links.
- Root cause 2: sitemap lists all 51 states × 31 specialties (1,581) but 625 combos have zero providers → 404.
- Root cause 3: sitemap truncated by Supabase's 1,000-row default: only 1,000/5,997 providers and 1,000/2,375 cities listed.
- Root cause 4: state insurance page links cities with 1 provider but city insurance page 404s <2; unconditional links to state/city telehealth pages (29 states have no telehealth providers).
- Root cause 5: `specialtySlugToName` static map covers 21 of 31 DB specialties (missing interstitial-cystitis, womens-health, postpartum-rehabilitation, …) and `slugify` keeps apostrophes ("women-s-health") while the SQL view strips them ("womens-health") → every link to those specialties 404s.
- Root cause 6: Next.js keeps matching later beforeFiles rewrites after a hit, so `/texas/manual-therapy-therapy` → `/texas/specialties/manual-therapy` → city rule re-matched with city="specialties" → 404 (only specialty whose slug ends in -therapy). Same city rule hijacked 8 provider slugs ending in "-physical-therapy".
- Root cause 7: state specialty sidebar linked all top-10 specialties regardless of state presence.
- Full production crawl (19,830 pages): 8,623 internal 404 links — 8,570 city-specialty, 27 state telehealth, 12 state specialty, 9 city insurance, 5 global specialty (apostrophe slugs).
- Old junk-city URLs from the April import are legitimately gone; not reconstructible (list not exposed by GSC API).

## Plan
- [x] `lib/data.ts`: paginate past 1,000 rows for getProviders / getCities / getTelehealthProviders; add specialty-presence helper per state
- [x] City × specialty page: serve with 1+ providers (noindex when only 1) so linked pages have data
- [x] Sitemap: only include state × specialty combos that have providers
- [x] Telehealth links: render only when telehealth providers exist for that state/city
- [x] Specialty slugs: strip apostrophes in slugify (match SQL view), resolve names via getSpecialtyBySlug, drop static map
- [x] City × insurance page: serve with 1+ providers (noindex when only 1)
- [x] Rewrite rule: exclude reserved segments (specialties/insurance/telehealth) from :city and "-physical-therapy" slugs from :specialty
- [x] State specialty sidebar: only link specialties present in the state
- [x] Data: renamed provider slug pinnacle-women-s-health-amp-therapy → pinnacle-womens-health-therapy-inc (HTML-entity artifact, collided with rewrite; 0 impressions)
- [x] Verify: 17 spot checks on local `next start` all 200; noindex confirmed on 1-provider pages; telehealth links only when providers exist; sitemap 6,706 → 12,547 URLs (all 5,997 providers, all 2,375 cities, 531 empty state×specialty combos dropped)
- [x] Legacy apostrophe specialty slugs (women-s-health etc.) 301 → current slugs in proxy.ts (555 crawled URLs)
- [x] Data: normalized duplicate city spellings (Lee’s Summit → Lee's Summit, Winston Salem → Winston-Salem) that made city_stats return 2 rows and 404 the city page
- [x] Verify: re-check of all 8,623 prod-404 URLs against local build → 8,036 × 200, 555 × 301, 32 × 404 (27 state telehealth pages with no providers, 4 CA state×specialty with no CA providers, 1 retired provider slug — none linked anymore)
- [ ] Commit

## Review (2026-09-24)
- The GSC "Not found (404)" bucket (5,104) was overwhelmingly self-inflicted: internal links pointing at pages whose notFound() rule they didn't satisfy, plus a slug map that drifted from the DB and a rewrite rule that re-matched its own output.
- Pages now serve for any combo with ≥1 provider; single-provider combos are `noindex,follow` so they don't dilute the index. Sitemap only advertises 2+ combos and real state×specialty pages.
- Sitemap grew from 6,706 to 12,547 URLs (was truncated by PostgREST's 1,000-row cap).
- Legit 404s that remain: URLs with no provider data (state telehealth for 29 states, empty state×specialty) and pre-cleanup junk-city URLs from April — Google will drop these; they are no longer linked or sitemapped.
- After deploy: resubmit sitemap in GSC, click "Validate Fix" on the 404 issue.
