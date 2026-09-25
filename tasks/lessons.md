
## 2026-09-24 — Prefer APIs over browser automation
- Correction: user said "You have the api access stop using the computer" while I was opening Search Console in Chrome.
- Rule: when an API credential exists in the repo (e.g. GOOGLE_SA_KEY in .env.local, Supabase service key), use it from a script. Only reach for browser automation when no API path exists, and say so first.
- Rule: run heavy concurrent network jobs (site crawls, bulk status checks) one at a time; running them alongside `next build` or Supabase queries causes connect timeouts on this machine.

## 2026-09-24 — 404 investigation patterns for this site
- Supabase/PostgREST silently caps responses at 1,000 rows. Any "fetch all" (sitemap, listings) must page with .range(). Check row counts vs. DB counts before trusting a list.
- Slug logic must match the SQL views (`specialty_stats` strips apostrophes). Never keep a hand-maintained slug→name map next to a DB-derived slug list; derive from the DB.
- Every internal link must point at a page whose notFound() condition is satisfied. When a page has a min-provider threshold, the link generator needs the same threshold (or the page must serve at 1).

## 2026-09-24 — Next.js rewrite gotchas (this repo)
- `beforeFiles` rewrites keep matching after a hit: the output of one rule is fed to the later rules. Any rule whose source is a param + suffix (`/:state/:city/:specialty-therapy`) can re-match another rule's destination. Exclude reserved segments with a lookahead on the param.
- Inside a param's custom regex, `$` is end-of-*path*, not end-of-segment. To exclude a segment value use `(?!(?:a|b)/)` when a slash follows, never `(?!a$)`.
- Verify rewrite regexes with `.next/routes-manifest.json` (the compiled `regex` field), not by reasoning about path-to-regexp.
- A 20k-page crawl of production gets the IP 403'd by Vercel's firewall for a while. Crawl once, at ≤16 concurrency, and verify fixes on a local `next start` instead of re-crawling prod.
