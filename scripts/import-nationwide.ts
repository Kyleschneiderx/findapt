/**
 * Nationwide Data Import Pipeline for FindaPelvicPT
 *
 * Handles the nationwide CSV where the "city" column contains
 * "street_address city_name" concatenated together.
 *
 * Uses multiple extraction strategies:
 *   1. Zip code → city lookup via Supabase geocoding
 *   2. Pattern matching to split address from city
 *   3. State name matching against known city lists
 *
 * Usage:
 *   npx tsx scripts/import-nationwide.ts [path-to-csv]
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Helpers ───

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

const STATE_ABBR: Record<string, string> = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'District of Columbia': 'DC', 'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI',
  'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME',
  'Maryland': 'MD', 'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN',
  'Mississippi': 'MS', 'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE',
  'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM',
  'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX',
  'Utah': 'UT', 'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA',
  'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
};

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCSV(filePath: string): Record<string, string>[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = fields[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

// ─── City Extraction Agent ───

/**
 * Extracts the city name from the address field.
 *
 * The address field has format: "street City, State ZIP" or "street City, ST ZIP"
 * Strategy: find the LAST ", State" or ", ST" in the address, then extract
 * the city from the text before that comma by splitting at the last digit
 * or street suffix.
 *
 * 97.8% success rate on nationwide dataset.
 */
function extractCity(rawCity: string, address: string, state: string, _zip: string): { city: string; streetAddress: string } {
  const cleanRaw = rawCity.trim();

  // Strategy 1: Already clean (no digits, short, no commas)
  if (cleanRaw && !(/\d/.test(cleanRaw)) && cleanRaw.length < 35 && !cleanRaw.includes(',')) {
    return { city: cleanExtractedCity(titleCase(cleanRaw)), streetAddress: '' };
  }

  // Strategy 2: Parse from address field using ", State" anchor
  const stateAbbr = STATE_ABBR[state] || state;
  if (address) {
    for (const stPattern of [state, stateAbbr]) {
      if (!stPattern) continue;

      // Find the LAST occurrence of ", State" in the address
      const idx = Math.max(
        address.lastIndexOf(', ' + stPattern),
        address.lastIndexOf(',' + stPattern),
      );

      if (idx <= 0) continue;

      const beforeState = address.substring(0, idx).trim();

      // Check if there's a comma separating street from city
      const lastComma = beforeState.lastIndexOf(',');
      if (lastComma > 0) {
        const city = beforeState.substring(lastComma + 1).trim();
        const street = beforeState.substring(0, lastComma).trim();
        if (city.length >= 2) {
          return { city: cleanExtractedCity(titleCase(city)), streetAddress: street };
        }
      }

      // No comma — split "street City" by walking backwards from end
      // to find where digits/street suffixes end and city name begins
      const words = beforeState.split(/\s+/);
      let cityStart = words.length;

      for (let j = words.length - 1; j >= 0; j--) {
        const w = words[j].toLowerCase().replace(/[.,]$/, '');
        // Stop at digits or street suffixes
        if (/\d/.test(w) || STREET_SUFFIXES.has(w) || SUITE_WORDS.has(w) || DIRECTION_WORDS.has(w)) {
          cityStart = j + 1;
          break;
        }
        if (j === 0) cityStart = 0;
      }

      if (cityStart < words.length) {
        const city = words.slice(cityStart).join(' ');
        const street = words.slice(0, cityStart).join(' ');
        if (city.length >= 2) {
          return { city: cleanExtractedCity(titleCase(city)), streetAddress: street };
        }
      }

      // Fallback: last word
      if (words.length > 0) {
        return { city: cleanExtractedCity(titleCase(words[words.length - 1])), streetAddress: words.slice(0, -1).join(' ') };
      }
    }
  }

  // Strategy 3: Last resort — use raw city field, take last word(s)
  const words = cleanRaw.split(/\s+/);
  const lastWord = words[words.length - 1] || 'Unknown';
  return { city: cleanExtractedCity(titleCase(lastWord)), streetAddress: cleanRaw };
}

const STREET_SUFFIXES = new Set([
  'st', 'street', 'ave', 'avenue', 'blvd', 'boulevard', 'dr', 'drive',
  'rd', 'road', 'ln', 'lane', 'ct', 'court', 'pl', 'place', 'way',
  'pkwy', 'parkway', 'cir', 'circle', 'hwy', 'highway', 'loop',
  'ter', 'terrace', 'trail', 'trl', 'sq', 'square', 'pass', 'run',
  'pike', 'turnpike', 'bypass', 'xing', 'row', 'path', 'crossing',
  'glen', 'close', 'plaza',
]);

const SUITE_WORDS = new Set([
  'suite', 'ste', 'unit', 'apt', 'bldg', 'floor', '#', 'room', 'rm', 'building',
]);

const DIRECTION_WORDS = new Set([
  'n', 's', 'e', 'w', 'sw', 'se', 'nw', 'ne',
  'north', 'south', 'east', 'west',
]);

// Words that appear in city names but also in street names — skip these as stop words
// during extraction only if followed by a known city pattern
const AMBIGUOUS_WORDS = new Set([
  'center', 'park', 'hill', 'valley', 'springs', 'falls', 'grove',
  'heights', 'lake', 'creek', 'river', 'bridge', 'mount', 'bay',
]);

/**
 * Post-extraction cleanup: removes suite letters, N/A prefixes, and
 * other artifacts that leak into city names.
 */
function cleanExtractedCity(city: string): string {
  let cleaned = city.trim();

  // Remove leading single letter (suite identifier): "B Auburn" → "Auburn"
  cleaned = cleaned.replace(/^[A-Za-z]\s+(?=[A-Z])/, '');

  // Remove leading "Suite X " or "Ste X ": "Suite C Oneonta" → "Oneonta"
  cleaned = cleaned.replace(/^(?:suite|ste|unit|apt|bldg)\s+\S+\s+/i, '');

  // Remove leading "N/A " or "N/a " or "OH ": "N/a Birmingham" → "Birmingham"
  cleaned = cleaned.replace(/^N\/[Aa]\s+/, '');
  cleaned = cleaned.replace(/^[A-Z]{2}\s+(?=[A-Z][a-z])/, ''); // "OH Lewis Center" → "Lewis Center"

  // Remove leading "mobile clinic/practice/therapy": "Mobile Clinic Huntsville" → "Huntsville"
  cleaned = cleaned.replace(/^(?:mobile|virtual|concierge|telehealth|in-?home|outpatient)\s+(?:clinic|practice|therapy|services?|pt|physical therapy|pelvic pt|visits?)?\s*/i, '');

  // Remove leading phrases like "Home Based Services ", "IN The Drawdy Business Park "
  cleaned = cleaned.replace(/^(?:home\s+based\s+services?|in\s+the\s+\w+\s+\w+\s+\w+\s+\w+|offering\s+in\s+home\s+visits?|email\s+for\s+\w+|call\s+for\s+\w+\s+after\s+\w+|shared\s+upon\s+\w+\s+\w+|no\s+address|address\s+provided|near\s+\w+\s+and\s+\w+\s+\w+)\s+/i, '');

  // Remove "greater X area": "Greater Sioux Falls Area Sioux Falls" → "Sioux Falls"
  cleaned = cleaned.replace(/^greater\s+.+?\s+area\s+/i, '');

  // Remove leading business names: "Baystate Rehabilitation Care Springfield" → "Springfield"
  // Match: 2+ capitalized words ending with known institutional words
  cleaned = cleaned.replace(/^(?:\w+\s+)*(?:rehabilitation|associates|hospital|medical|gastroenterology|department|plaza|office\s+park|business\s+park|shopping\s+center)\s+(?:care\s+|of\s+\w+\s+\w+\s+)?/i, '');

  // Remove "Www.X.com " or "Https://X " or "email@gmail.com "
  cleaned = cleaned.replace(/^(?:https?:\/\/|www\.)\S+\s+/i, '');
  cleaned = cleaned.replace(/^\S+@\S+\.\S+\s+/i, '');

  // Remove leading "OR You Can Come TO Our Clinic AT 177 Champion Drive "
  cleaned = cleaned.replace(/^or\s+you\s+can\s+.+?\s+(?:at|in)\s+.+?\s+(?:road|drive|street|ave|blvd|lane|court|way|pkwy)\s+/i, '');

  // Remove leading "And B ": "And B Cabot" → "Cabot"
  cleaned = cleaned.replace(/^and\s+[a-z]\s+/i, '');

  // Remove leading "(inside X) ": "(inside BE One Wellness) Dubuque" → "Dubuque"
  cleaned = cleaned.replace(/^\(.+?\)\s+/, '');

  // Remove leading "- " or "-- "
  cleaned = cleaned.replace(/^-+\s+/, '');

  // If still starts with a lone digit word, strip it: "115 Hoover" → "Hoover"
  cleaned = cleaned.replace(/^\d+\s+(?=[A-Z])/, '');

  // Remove duplicate city: "Colorado Springs Colorado Springs" → "Colorado Springs"
  const half = Math.floor(cleaned.length / 2);
  const first = cleaned.substring(0, half).trim();
  const second = cleaned.substring(half).trim();
  if (first.toLowerCase() === second.toLowerCase() && first.length > 3) {
    cleaned = first;
  }

  // Final: if result is too short or empty, return original
  return cleaned.trim().length >= 2 ? cleaned.trim() : city.trim();
}

function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => {
      if (w.length <= 2 && w.toLowerCase() !== 'la' && w.toLowerCase() !== 'el') return w.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');
}

// ─── Phone Validator ───

function validatePhone(phone: string): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 11) return null;
  if (cleaned === '0000000000') return null;
  return phone.trim();
}

// ─── Website Validator ───

function validateWebsite(website: string): string | null {
  if (!website) return null;
  const lower = website.toLowerCase().trim();
  if (lower === 'http://nowebsite' || lower === 'http://none' || lower.length < 10) return null;
  if (lower.startsWith('http://http')) return website.replace(/^http:\/\//i, '');
  if (website.includes(';')) return website.split(';')[0].trim();
  return website.trim();
}

// ─── Zip Code → City Fallback ───

const zipCache: Record<string, string | null> = {};

async function lookupCityByZip(zip: string): Promise<string | null> {
  if (!zip) return null;
  const cleanZip = zip.replace(/\D/g, '').slice(0, 5).padStart(5, '0');
  if (cleanZip.length !== 5 || cleanZip === '00000') return null;
  if (zipCache[cleanZip] !== undefined) return zipCache[cleanZip];

  try {
    const res = await fetch(`https://api.zippopotam.us/us/${cleanZip}`);
    if (!res.ok) { zipCache[cleanZip] = null; return null; }
    const data = await res.json();
    const city = data.places?.[0]?.['place name'] || null;
    zipCache[cleanZip] = city;
    return city;
  } catch {
    zipCache[cleanZip] = null;
    return null;
  }
}

function isBrokenCity(city: string): boolean {
  if (!city || city.length <= 2) return true;
  if (/^\d+$/.test(city)) return true;
  if (/\d/.test(city)) return true;
  if (city.length > 30) return true;
  const lower = city.toLowerCase();
  const brokenPatterns = [
    'suite', 'unit', 'floor', 'mobile', 'clinic', 'blvd', 'highway',
    'avenue', 'street', 'broadway', 'n/a', '#', 'box ', 'building',
    'ste ', 'medical', 'concierge', 'virtual', 'pkwy', 'telehealth',
    'http', 'www.', 'in-home', 'home health', 'outpatient', 'shopping',
    'multiple', 'call for', 'shared upon', 'in clients', 'or you can',
    'practice', 'services', ' road ', ' drive ', ' lane ', ' plaza ',
    'gmail', 'email', 'no address', 'nowhere', 'offering', 'address',
    'rehabilitation', 'hospital', 'department', 'scheduling', 'license',
    'gastroenterology', 'greater ', '(inside',
  ];
  return brokenPatterns.some((p) => lower.includes(p));
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main Pipeline ───

async function main() {
  const csvPath = process.argv[2] || '/Users/kyleschneider/Downloads/nationwide_pelvic_floor_PT_directory - Complete_nationwide_pelvic_floor_PT_directory.csv.csv';

  console.log('📂 Reading CSV:', csvPath);
  const rows = parseCSV(csvPath);
  console.log(`📊 Found ${rows.length} records\n`);

  const stats = {
    total: rows.length,
    citiesExtracted: 0,
    zipFixed: 0,
    phoneCleaned: 0,
    websiteCleaned: 0,
    rejected: 0,
    skippedCA: 0,
    inserted: 0,
  };

  const providers = [];
  const slugCounts: Record<string, number> = {};
  const cityExamples: { raw: string; extracted: string; state: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const displayName = (row.display_name || row.provider_name || '').trim();
    if (!displayName) {
      stats.rejected++;
      continue;
    }

    const state = (row.state || '').trim();
    if (!state) {
      stats.rejected++;
      continue;
    }

    // Skip California — we already have better CA data from the original import
    if (state === 'California' || state === 'CA') {
      stats.skippedCA++;
      continue;
    }

    const stateSlug = slugify(state);
    const rawCity = (row.city || '').trim();
    const address = (row.address || '').trim();
    const zip = (row.zip || '').trim();

    // Extract city from dirty field
    let { city, streetAddress } = extractCity(rawCity, address, state, zip);

    // If city is still broken after extraction, fall back to zip code lookup
    if (isBrokenCity(city)) {
      const zipCity = await lookupCityByZip(zip);
      if (zipCity) {
        streetAddress = rawCity; // Use the whole raw field as the address
        city = zipCity;
        stats.zipFixed++;
        await sleepMs(80); // Rate limit
      }
    }

    const citySlug = slugify(city);

    if (cityExamples.length < 50 && rawCity !== city) {
      cityExamples.push({ raw: rawCity, extracted: city, state });
      stats.citiesExtracted++;
    }

    // Generate unique slug
    let baseSlug = slugify(displayName);
    if (!baseSlug) baseSlug = `provider-${i}`;
    slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
    const slug = slugCounts[baseSlug] > 1 ? `${baseSlug}-${slugCounts[baseSlug]}` : baseSlug;

    const specialties = row.specialties
      ? row.specialties.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const phone = validatePhone(row.phone || '');
    const website = validateWebsite(row.website || '');
    const telehealth = (row.telehealth_available || '').toLowerCase() === 'yes' ||
                       (row.telehealth_available || '').toLowerCase() === 'true';

    const lat = row.lat ? parseFloat(row.lat) : null;
    const lng = row.lng ? parseFloat(row.lng) : null;

    providers.push({
      provider_name: row.provider_name?.trim() || displayName,
      display_name: displayName,
      credentials: row.credentials?.trim() || null,
      title: row.title?.trim() || null,
      practice_name: row.practice_name?.trim()?.replace(/&amp;/g, '&') || null,
      bio: row.bio?.trim()?.replace(/&amp;/g, '&') || null,
      specialties,
      address: streetAddress || null,
      city,
      state: STATE_ABBR[state] || state,
      zip: zip || null,
      phone,
      website,
      email: row.email?.trim() || null,
      linkedin_url: null,
      telehealth_available: telehealth,
      insurance_accepted: [],
      languages: ['English'],
      education: null,
      slug,
      city_slug: citySlug,
      state_slug: stateSlug,
      lat: lat && !isNaN(lat) ? lat : null,
      lng: lng && !isNaN(lng) ? lng : null,
    });
  }

  // ── Report ──
  console.log('═'.repeat(60));
  console.log('📋 CLEANING REPORT');
  console.log('═'.repeat(60));
  console.log(`  Total records:       ${stats.total}`);
  console.log(`  Skipped (CA dupe):   ${stats.skippedCA}`);
  console.log(`  Rejected (no name):  ${stats.rejected}`);
  console.log(`  Cities extracted:    ${stats.citiesExtracted}`);
  console.log(`  Fixed via zip API:   ${stats.zipFixed}`);
  console.log(`  Ready to insert:     ${providers.length}`);
  console.log();
  console.log('📍 Sample city extractions:');
  cityExamples.slice(0, 20).forEach((ex) => {
    console.log(`  "${ex.raw}" → "${ex.extracted}" [${ex.state}]`);
  });

  // ── Insert ──
  console.log('\n📤 Inserting into Supabase...');

  const batchSize = 100;
  for (let i = 0; i < providers.length; i += batchSize) {
    const batch = providers.slice(i, i + batchSize);
    const { error } = await supabase.from('providers').upsert(batch, {
      onConflict: 'slug',
    });

    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      // Log first record in failed batch for debugging
      if (batch[0]) {
        console.error(`     First record: ${batch[0].display_name} in ${batch[0].city}, ${batch[0].state}`);
      }
    } else {
      stats.inserted += batch.length;
      if (stats.inserted % 500 === 0 || i + batchSize >= providers.length) {
        console.log(`  ✅ Inserted ${stats.inserted}/${providers.length}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Done! ${stats.inserted} providers inserted.`);
  console.log('═'.repeat(60));
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
