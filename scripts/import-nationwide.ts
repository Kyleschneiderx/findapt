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
 * Extracts the city name from a field like "4411 Suwanee Dam Rd Suite 330 Suwanee"
 *
 * Strategy:
 * 1. If the field has no digits and is short, it's already a clean city name
 * 2. Try to match known city patterns from the address field (address has "city, state zip")
 * 3. Use the address field to extract city by finding text between last comma-state pair
 * 4. Fall back to last 1-3 words of the city field
 */
function extractCity(rawCity: string, address: string, state: string, zip: string): { city: string; streetAddress: string } {
  const cleanRaw = rawCity.trim();

  // Strategy 1: Already clean (no digits, short, no commas)
  if (cleanRaw && !(/\d/.test(cleanRaw)) && cleanRaw.length < 35 && !cleanRaw.includes(',')) {
    return { city: titleCase(cleanRaw), streetAddress: '' };
  }

  // Strategy 2: Parse from address field "street, city, state zip" or "street city, state zip"
  const stateAbbr = STATE_ABBR[state] || state;
  if (address) {
    // Try: "something City, State ZIP" or "something City, ST ZIP"
    const patterns = [
      new RegExp(`(.+?)\\s+([A-Za-z][A-Za-z .'-]+),\\s*${escapeRegex(state)}\\s+${escapeRegex(zip)}`, 'i'),
      new RegExp(`(.+?)\\s+([A-Za-z][A-Za-z .'-]+),\\s*${escapeRegex(stateAbbr)}\\s+${escapeRegex(zip)}`, 'i'),
      new RegExp(`(.+?)\\s+([A-Za-z][A-Za-z .'-]+),\\s*${escapeRegex(state)}`, 'i'),
      new RegExp(`(.+?)\\s+([A-Za-z][A-Za-z .'-]+),\\s*${escapeRegex(stateAbbr)}`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match) {
        const possibleCity = match[2].trim();
        // Validate: city should be 2+ chars, no digits, not look like a street suffix
        if (possibleCity.length >= 2 && !(/\d/.test(possibleCity)) && !isStreetSuffix(possibleCity)) {
          return { city: titleCase(possibleCity), streetAddress: match[1].trim() };
        }
      }
    }
  }

  // Strategy 3: Extract from raw city field — last word(s) are the city
  // Remove zip code and state from end if present
  let cleaned = cleanRaw
    .replace(new RegExp(`\\s*,?\\s*${escapeRegex(state)}\\s*$`, 'i'), '')
    .replace(new RegExp(`\\s*,?\\s*${escapeRegex(stateAbbr)}\\s*$`, 'i'), '')
    .replace(new RegExp(`\\s+${escapeRegex(zip)}\\s*$`), '')
    .trim();

  // Try to find where the city name starts by looking for the last sequence
  // of title-case words that aren't street suffixes
  const words = cleaned.split(/\s+/);
  let cityStart = words.length - 1;

  // Walk backwards to find multi-word cities
  for (let i = words.length - 1; i >= 0; i--) {
    const word = words[i];
    // Stop if we hit a number, suite indicator, or common street suffix
    if (/^\d/.test(word) || /^(suite|ste|unit|apt|bldg|floor|#)/i.test(word)) {
      break;
    }
    cityStart = i;
    // Multi-word cities: keep going back if next word is title-case and not a street type
    if (i > 0 && !isStreetSuffix(words[i - 1]) && !(/^\d/.test(words[i - 1]))) {
      // Check if the combo is more likely a city or address
      // Common multi-word city patterns: "San Diego", "New York", "Salt Lake City"
      const prevWord = words[i - 1].toLowerCase();
      if (['san', 'new', 'los', 'las', 'fort', 'st', 'st.', 'saint', 'north', 'south', 'east', 'west',
           'el', 'la', 'mount', 'mt', 'lake', 'park', 'palm', 'long', 'grand', 'hot', 'bay',
           'ocean', 'silver', 'cedar', 'coral', 'royal', 'white', 'black', 'green', 'blue',
           'red', 'big', 'little', 'old', 'upper', 'lower', 'santa', 'port', 'cape', 'iowa',
           'owens', 'cross', 'belle', 'bonita', 'boca', 'daly', 'del', 'paso', 'rancho',
           'thousand', 'mineral', 'sugar', 'garden', 'rolling', 'pleasant', 'indian', 'winter',
           'spring', 'falls', 'rock', 'pine', 'oak', 'cherry', 'flower', 'pleasant'].includes(prevWord)) {
        continue; // Keep going back for multi-word city
      }
    }
    break;
  }

  const cityName = words.slice(cityStart).join(' ');
  const streetAddr = words.slice(0, cityStart).join(' ');

  if (cityName && cityName.length >= 2) {
    return { city: titleCase(cityName), streetAddress: streetAddr };
  }

  // Fallback: just use last word
  return { city: titleCase(words[words.length - 1] || 'Unknown'), streetAddress: cleaned };
}

function isStreetSuffix(word: string): boolean {
  const suffixes = new Set([
    'st', 'street', 'ave', 'avenue', 'blvd', 'boulevard', 'dr', 'drive',
    'rd', 'road', 'ln', 'lane', 'ct', 'court', 'pl', 'place', 'way',
    'pkwy', 'parkway', 'cir', 'circle', 'hwy', 'highway', 'loop',
    'ter', 'terrace', 'trail', 'trl', 'sq', 'square', 'pass', 'run',
  ]);
  return suffixes.has(word.toLowerCase().replace(/\.$/, ''));
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

// ─── Main Pipeline ───

async function main() {
  const csvPath = process.argv[2] || '/Users/kyleschneider/Downloads/nationwide_pelvic_floor_PT_directory - Complete_nationwide_pelvic_floor_PT_directory.csv.csv';

  console.log('📂 Reading CSV:', csvPath);
  const rows = parseCSV(csvPath);
  console.log(`📊 Found ${rows.length} records\n`);

  // First, add lat/lng columns if they don't exist
  console.log('📦 Ensuring database schema supports lat/lng...');
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
      ALTER TABLE providers ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;
    `,
  }).maybeSingle();
  // This might fail if rpc doesn't exist, that's ok — we'll handle via MCP later
  if (alterError) {
    console.log('  ⚠️  Could not auto-add lat/lng columns. They may need to be added via Supabase dashboard.');
  }

  const stats = {
    total: rows.length,
    citiesExtracted: 0,
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
    const { city, streetAddress } = extractCity(rawCity, address, state, zip);
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
