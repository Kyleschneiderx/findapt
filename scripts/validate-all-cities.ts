/**
 * COMPREHENSIVE CITY VALIDATOR
 *
 * Validates EVERY provider's city against zip code API data.
 * For each provider:
 *   1. Look up the correct city from their zip code
 *   2. If current city contains address artifacts (road names, suite numbers, etc.),
 *      replace with zip-based city
 *   3. If current city is a legitimate name that differs from USPS designation,
 *      keep it (e.g., "Hoover" vs USPS "Birmingham")
 *   4. Log all changes and unfixable records
 *
 * Usage:
 *   npx tsx scripts/validate-all-cities.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseKey) { console.error('Missing env vars'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Zip Cache ───
const zipCache: Record<string, string | null> = {};

async function lookupZip(zip: string): Promise<string | null> {
  const clean = zip.replace(/[^0-9]/g, '').slice(0, 5).padStart(5, '0');
  if (clean.length !== 5 || clean === '00000') return null;
  if (zipCache[clean] !== undefined) return zipCache[clean];

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${clean}`);
    if (!res.ok) { zipCache[clean] = null; return null; }
    const data = await res.json();
    const city = data.places?.[0]?.['place name'] || null;
    zipCache[clean] = city;
    return city;
  } catch { zipCache[clean] = null; return null; }
}

// ─── Is city name clearly broken? ───
// These are STRICT patterns — if ANY of these match, the city is definitely
// wrong and should be replaced with the zip-based city.
function isClearlyBroken(city: string): boolean {
  if (!city || city.length <= 2) return true;
  if (/\d/.test(city)) return true; // Contains any digit

  const lower = city.toLowerCase();

  // Street suffixes that should never be in a city name (except as part of legit city names handled below)
  const streetWords = /\b(rd|road|st|street|ave|avenue|blvd|boulevard|dr|drive|ln|lane|ct|court|hwy|highway|pkwy|parkway|cir|circle|trl|trail|loop|ter|terrace|pl|place|bypass|pike|sq|square)\b/i;
  if (streetWords.test(lower)) {
    // But allow legitimate city names that contain these words
    const legitCities = [
      'st. louis', 'st louis', 'st. paul', 'st paul', 'st. petersburg', 'st petersburg',
      'st. augustine', 'st augustine', 'st. charles', 'st charles', 'st. george', 'st george',
      'st. cloud', 'st cloud', 'st. clair shores', 'st clair shores', 'st. marys', 'st marys',
      'st. joseph', 'st joseph', 'st. albans', 'st albans', 'st. helena', 'st helena',
      'court house', 'byron center', 'kennett square', 'lewis center', 'adams center',
      'circle pines', 'park ridge', 'park city', 'pleasant prairie', 'prairie du sac',
      'traverse city', 'lake placid', 'round rock', 'castle rock', 'eagle rock',
      'owens cross roads', 'cross plains', 'cross lanes', 'dripping springs',
      'coral springs', 'hot springs', 'palm springs', 'colorado springs',
      'bonita springs', 'sandy springs', 'mineral springs', 'holly springs',
      'hendersonville', 'jacksonville', 'fayetteville', 'wrightsville',
      'hopkinsville', 'greenville', 'starkville', 'knoxville', 'evansville',
      'brownsville', 'clarksville', 'huntsville', 'mobile', 'overland park',
      'highland park', 'winter park', 'oak park', 'orland park', 'tinley park',
      'cedar park', 'avon park', 'college park', 'buena park', 'menlo park',
      'clifton park', 'estes park', 'asbury park', 'canfield', 'deerfield',
      'springfield', 'mansfield', 'bloomfield', 'plainfield', 'marshfield',
      'westfield', 'fairfield', 'clearfield', 'brookfield', 'greenfield',
      'pittsfield', 'ridgefield', 'bakersfield', 'chesterfield',
      'old saybrook', 'new hartford', 'west hartford', 'east hartford',
      'new haven', 'fair haven', 'north haven', 'south haven', 'winter haven',
      'belle haven', 'bel air',
    ];
    if (legitCities.some(lc => lower === lc || lower.startsWith(lc))) return false;
    return true; // Has street word and not a known legitimate city
  }

  // Other clear broken patterns
  const brokenPatterns = [
    'suite', 'ste ', 'unit ', 'apt ', 'bldg', 'floor', '#',
    'mobile', 'virtual', 'telehealth', 'clinic', 'concierge',
    'medical', 'hospital', 'shopping', 'building', 'office',
    'http', 'www.', 'gmail', '.com', '.org',
    'n/a', 'no address', 'nowhere', 'call for', 'email for',
    'shared upon', 'offering', 'scheduling', 'license',
    'rehabilitation', 'department', 'outpatient', 'services',
    'associates', 'gastroenterology', 'greater ', 'area ',
    'in-home', 'home based', 'home visit', 'in home',
    'or you can', 'and telehealth', 'in the ',
    '(inside', 'ivy -',
  ];
  if (brokenPatterns.some(p => lower.includes(p))) return true;

  // Starts with dash, parenthesis, or "and"
  if (/^[-(\s]/.test(city) || /^and\b/i.test(city)) return true;

  // Very long — likely has address artifacts
  if (city.length > 30) return true;

  return false;
}

// ─── Main ───
async function main() {
  console.log('🔍 Loading all providers...\n');

  // Paginate to get all providers
  let all: { id: string; city: string; state: string; zip: string | null; display_name: string }[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('providers')
      .select('id, city, state, zip, display_name')
      .range(offset, offset + 999);
    if (error) { console.error(error.message); break; }
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < 1000) break;
    offset += 1000;
  }

  console.log(`📊 Total providers: ${all.length}`);

  // Identify broken cities
  const broken = all.filter(p => isClearlyBroken(p.city));
  const clean = all.filter(p => !isClearlyBroken(p.city));

  console.log(`✅ Clean cities: ${clean.length}`);
  console.log(`❌ Broken cities: ${broken.length}`);

  // Collect unique zips from broken records
  const brokenZips = new Set<string>();
  for (const p of broken) {
    if (p.zip) {
      const z = p.zip.replace(/[^0-9]/g, '').slice(0, 5).padStart(5, '0');
      if (z.length === 5 && z !== '00000') brokenZips.add(z);
    }
  }

  console.log(`\n📮 Looking up ${brokenZips.size} unique zips for broken cities...\n`);

  let looked = 0;
  for (const zip of brokenZips) {
    await lookupZip(zip);
    looked++;
    if (looked % 50 === 0) console.log(`  ${looked}/${brokenZips.size}...`);
    await sleep(80);
  }
  console.log(`  ${looked}/${brokenZips.size} done\n`);

  // Fix broken cities
  const fixes: { id: string; old: string; new_city: string; state: string; zip: string }[] = [];
  const unfixable: { id: string; city: string; state: string; zip: string | null; name: string }[] = [];

  for (const p of broken) {
    const z = p.zip?.replace(/[^0-9]/g, '').slice(0, 5).padStart(5, '0');
    const zipCity = z ? zipCache[z] : null;

    if (zipCity) {
      fixes.push({ id: p.id, old: p.city, new_city: zipCity, state: p.state, zip: p.zip || '' });
    } else {
      // Try to extract city from the broken name as last resort
      const words = p.city.replace(/^[-#(]+\s*/, '').split(/\s+/);
      // Take the last word(s) that look like a city name
      let extracted: string | null = null;
      for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i];
        if (/\d/.test(w) || w.length <= 2) continue;
        const candidate = words.slice(i).join(' ');
        if (candidate.length >= 3 && !/\d/.test(candidate)) {
          extracted = candidate.replace(/^(road|rd|st|street|ave|drive|dr|ln|lane|ct|hwy|blvd|pkwy|plaza|way)\s+/i, '');
          if (extracted.length >= 3) break;
        }
      }

      if (extracted && extracted.length >= 3 && !isClearlyBroken(extracted)) {
        fixes.push({ id: p.id, old: p.city, new_city: extracted, state: p.state, zip: p.zip || '' });
      } else {
        unfixable.push({ id: p.id, city: p.city, state: p.state, zip: p.zip, name: p.display_name });
      }
    }
  }

  // Report
  console.log('═'.repeat(60));
  console.log('📋 VALIDATION REPORT');
  console.log('═'.repeat(60));
  console.log(`  Total providers:     ${all.length}`);
  console.log(`  Already clean:       ${clean.length}`);
  console.log(`  Broken → fixed:      ${fixes.length}`);
  console.log(`  Unfixable:           ${unfixable.length}`);
  console.log();

  if (fixes.length > 0) {
    console.log('📍 All fixes:');
    fixes.forEach(f => {
      console.log(`  "${f.old}" → "${f.new_city}" [${f.state} ${f.zip}]`);
    });
  }

  if (unfixable.length > 0) {
    console.log('\n⚠️  Unfixable (will be deleted):');
    unfixable.forEach(u => {
      console.log(`  "${u.city}" [${u.state} zip=${u.zip}] — ${u.name}`);
    });
  }

  // Apply fixes
  if (fixes.length > 0) {
    console.log(`\n📤 Applying ${fixes.length} fixes...`);
    let fixed = 0;
    for (const f of fixes) {
      const { error } = await supabase.from('providers').update({
        city: f.new_city,
        city_slug: slugify(f.new_city),
      }).eq('id', f.id);
      if (!error) fixed++;
      else console.error(`  ❌ ${f.id}: ${error.message}`);
    }
    console.log(`  ✅ Fixed ${fixed}/${fixes.length}`);
  }

  // Delete unfixable
  if (unfixable.length > 0) {
    console.log(`\n🗑️  Deleting ${unfixable.length} unfixable records...`);
    for (const u of unfixable) {
      await supabase.from('providers').delete().eq('id', u.id);
    }
    console.log(`  Done.`);
  }

  // Final count
  const { data: finalCount } = await supabase.from('providers').select('id', { count: 'exact', head: true });
  console.log(`\n📊 Final provider count: check Supabase dashboard`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
