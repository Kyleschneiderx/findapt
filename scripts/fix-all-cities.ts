/**
 * Comprehensive City Fixer for FindaPelvicPT
 *
 * Pulls ALL non-CA providers, looks up the correct city via zip code,
 * and fixes any that don't match. This catches all dirty city names
 * regardless of pattern.
 *
 * Usage:
 *   npx tsx scripts/fix-all-cities.ts
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Zip Code → City Lookup ───

const zipCache: Record<string, string | null> = {};

async function lookupCityByZip(zip: string): Promise<string | null> {
  if (!zip) return null;
  const cleanZip = zip.replace(/\D/g, '').slice(0, 5).padStart(5, '0');
  if (cleanZip.length !== 5 || cleanZip === '00000') return null;

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

/**
 * Check if the current city name is "close enough" to the zip-based city.
 * We don't want to overwrite valid multi-word cities that the zip API
 * returns in abbreviated form (e.g., "San Francisco" vs "S San Fran").
 */
function cityMatchesZip(currentCity: string, zipCity: string): boolean {
  const a = currentCity.toLowerCase().trim();
  const b = zipCity.toLowerCase().trim();

  // Exact match
  if (a === b) return true;

  // One contains the other (handles "North Hollywood" vs "Hollywood")
  if (a.includes(b) || b.includes(a)) return true;

  // Ends with the zip city (handles "2nd Floor Brooklyn" → "Brooklyn")
  if (a.endsWith(b)) return true;

  // Slugs match
  if (slugify(a) === slugify(b)) return true;

  return false;
}

// ─── Main ───

async function main() {
  console.log('🔍 Fetching all non-CA providers...\n');

  // Supabase limits to 1000 per query, so paginate
  let allProviders: { id: string; city: string; state: string; zip: string; display_name: string }[] = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, city, state, zip, display_name')
      .neq('state', 'CA')
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error:', error.message);
      break;
    }
    if (!data || data.length === 0) break;
    allProviders = allProviders.concat(data);
    if (data.length < pageSize) break;
    offset += pageSize;
  }

  console.log(`📊 Total non-CA providers: ${allProviders.length}`);

  // Collect unique zips
  const uniqueZips = new Set<string>();
  for (const p of allProviders) {
    if (p.zip) {
      const clean = p.zip.replace(/\D/g, '').slice(0, 5).padStart(5, '0');
      if (clean.length === 5 && clean !== '00000') uniqueZips.add(clean);
    }
  }

  console.log(`📮 Looking up ${uniqueZips.size} unique zip codes...\n`);

  let looked = 0;
  for (const zip of uniqueZips) {
    await lookupCityByZip(zip);
    looked++;
    if (looked % 100 === 0) {
      console.log(`  Looked up ${looked}/${uniqueZips.size} zips...`);
    }
    await sleep(80); // Rate limit
  }
  console.log(`  Looked up ${looked}/${uniqueZips.size} zips\n`);

  // Compare each provider's city against zip-based city
  const fixes: { id: string; oldCity: string; newCity: string; state: string; zip: string }[] = [];
  let alreadyCorrect = 0;
  let noZipData = 0;

  for (const p of allProviders) {
    const cleanZip = p.zip?.replace(/\D/g, '').slice(0, 5).padStart(5, '0');
    const zipCity = cleanZip ? zipCache[cleanZip] : null;

    if (!zipCity) {
      noZipData++;
      continue;
    }

    if (cityMatchesZip(p.city, zipCity)) {
      alreadyCorrect++;
      continue;
    }

    // City doesn't match zip — needs fixing
    fixes.push({
      id: p.id,
      oldCity: p.city,
      newCity: zipCity,
      state: p.state,
      zip: p.zip || '',
    });
  }

  console.log('═'.repeat(60));
  console.log('📋 COMPREHENSIVE FIX REPORT');
  console.log('═'.repeat(60));
  console.log(`  Total providers:     ${allProviders.length}`);
  console.log(`  Already correct:     ${alreadyCorrect}`);
  console.log(`  Needs fixing:        ${fixes.length}`);
  console.log(`  No zip data:         ${noZipData}`);
  console.log();

  if (fixes.length > 0) {
    console.log('📍 Sample fixes:');
    fixes.slice(0, 40).forEach((f) => {
      console.log(`  "${f.oldCity}" → "${f.newCity}" [${f.state} ${f.zip}]`);
    });
  }

  if (fixes.length === 0) {
    console.log('✅ All cities are correct!');
    return;
  }

  // Apply fixes
  console.log(`\n📤 Applying ${fixes.length} fixes to database...`);

  let fixed = 0;
  let errors = 0;
  for (const fix of fixes) {
    const { error: updateError } = await supabase
      .from('providers')
      .update({
        city: fix.newCity,
        city_slug: slugify(fix.newCity),
      })
      .eq('id', fix.id);

    if (updateError) {
      errors++;
      if (errors <= 5) console.error(`  ❌ ${fix.id}:`, updateError.message);
    } else {
      fixed++;
    }

    if (fixed % 200 === 0 && fixed > 0) {
      console.log(`  Updated ${fixed}/${fixes.length}...`);
    }
  }

  console.log(`\n✅ Fixed ${fixed}/${fixes.length} providers. (${errors} errors)`);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
