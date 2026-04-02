/**
 * City Data Fixer for FindaPelvicPT
 *
 * Uses zip code → city lookups via the Zippopotam.us API to fix
 * dirty city names in the database. Targets records where the city
 * field contains address artifacts (digits, suite numbers, state
 * abbreviations, etc.)
 *
 * Usage:
 *   npx tsx scripts/fix-cities.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ─── Zip Code → City Lookup ───

const zipCache: Record<string, string | null> = {};

async function lookupCityByZip(zip: string): Promise<string | null> {
  if (!zip) return null;

  // Normalize zip to 5 digits
  const cleanZip = zip.replace(/\D/g, '').slice(0, 5).padStart(5, '0');
  if (cleanZip.length !== 5) return null;

  if (zipCache[cleanZip] !== undefined) return zipCache[cleanZip];

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
    if (!res.ok) {
      zipCache[cleanZip] = null;
      return null;
    }
    const data = await res.json();
    const city = data.places?.[0]?.['place name'] || null;
    zipCache[cleanZip] = city;
    return city;
  } catch {
    zipCache[cleanZip] = null;
    return null;
  }
}

// ─── Rate limiter (be nice to free API) ───

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ───

async function main() {
  console.log('🔍 Finding providers with bad city names...\n');

  // Fetch ALL non-CA providers and filter bad cities in code
  const { data: allProviders, error } = await supabase
    .from('providers')
    .select('id, city, state, zip, address, display_name, city_slug')
    .neq('state', 'CA');

  if (error) {
    console.error('Error fetching providers:', error.message);
    process.exit(1);
  }

  const STATE_ABBRS = new Set([
    'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
    'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
    'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
    'VT','VA','WA','WV','WI','WY',
  ]);

  function isBadCity(city: string): boolean {
    if (!city || city.length <= 2) return true;
    if (/\d/.test(city)) return true;
    if (STATE_ABBRS.has(city.toUpperCase())) return true;
    const lower = city.toLowerCase();
    const badPatterns = [
      'suite', 'unit', 'floor', 'mobile', 'clinic', 'blvd', 'highway',
      'avenue', 'street', 'broadway', 'n/a', '#', 'box ', 'building',
      'ste ', 'medical', 'concierge', 'virtual', 'pkwy',
    ];
    return badPatterns.some((p) => lower.includes(p));
  }

  const providers = (allProviders || []).filter((p) => isBadCity(p.city));
  console.log(`📊 Found ${providers.length} providers with bad city names\n`);

  if (providers.length === 0) {
    console.log('✅ No bad cities found!');
    return;
  }

  // Collect unique zips to minimize API calls
  const uniqueZips = new Set<string>();
  for (const p of providers) {
    if (p.zip) {
      const clean = p.zip.replace(/\D/g, '').slice(0, 5).padStart(5, '0');
      if (clean.length === 5) uniqueZips.add(clean);
    }
  }

  console.log(`📮 Looking up ${uniqueZips.size} unique zip codes...\n`);

  // Batch lookup all zips (with rate limiting)
  let looked = 0;
  for (const zip of uniqueZips) {
    await lookupCityByZip(zip);
    looked++;
    if (looked % 50 === 0) {
      console.log(`  Looked up ${looked}/${uniqueZips.size} zips...`);
    }
    // Rate limit: ~10 requests per second
    await sleep(100);
  }
  console.log(`  Looked up ${looked}/${uniqueZips.size} zips\n`);

  // Now fix each provider
  const fixes: { id: string; oldCity: string; newCity: string; state: string; zip: string }[] = [];
  const unfixable: { id: string; city: string; state: string; zip: string; name: string }[] = [];

  for (const p of providers) {
    const cleanZip = p.zip?.replace(/\D/g, '').slice(0, 5).padStart(5, '0');
    const correctCity = cleanZip ? zipCache[cleanZip] : null;

    if (correctCity) {
      fixes.push({
        id: p.id,
        oldCity: p.city,
        newCity: correctCity,
        state: p.state,
        zip: p.zip || '',
      });
    } else {
      unfixable.push({
        id: p.id,
        city: p.city,
        state: p.state,
        zip: p.zip || '(none)',
        name: p.display_name,
      });
    }
  }

  // Print report
  console.log('═'.repeat(60));
  console.log('📋 FIX REPORT');
  console.log('═'.repeat(60));
  console.log(`  Total bad cities:  ${providers.length}`);
  console.log(`  Fixable via zip:   ${fixes.length}`);
  console.log(`  Unfixable:         ${unfixable.length}`);
  console.log();

  console.log('📍 Sample fixes:');
  fixes.slice(0, 25).forEach((f) => {
    console.log(`  "${f.oldCity}" → "${f.newCity}" [${f.state} ${f.zip}]`);
  });

  if (unfixable.length > 0) {
    console.log('\n⚠️  Unfixable records (no zip or zip lookup failed):');
    unfixable.slice(0, 15).forEach((u) => {
      console.log(`  "${u.city}" [${u.state} zip=${u.zip}] — ${u.name}`);
    });
  }

  // Apply fixes in batches
  console.log(`\n📤 Applying ${fixes.length} fixes to database...`);

  let fixed = 0;
  for (const fix of fixes) {
    const newCitySlug = slugify(fix.newCity);
    const { error: updateError } = await supabase
      .from('providers')
      .update({
        city: fix.newCity,
        city_slug: newCitySlug,
      })
      .eq('id', fix.id);

    if (updateError) {
      console.error(`  ❌ Failed to update ${fix.id}:`, updateError.message);
    } else {
      fixed++;
    }
  }

  console.log(`\n✅ Fixed ${fixed}/${fixes.length} providers.`);

  if (unfixable.length > 0) {
    console.log(`⚠️  ${unfixable.length} records need manual review (no valid zip code).`);
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
