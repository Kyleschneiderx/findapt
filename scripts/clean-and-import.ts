/**
 * Data Cleaning & Import Pipeline for FindaPT
 *
 * This script runs multiple validation agents on the CSV data before
 * inserting into Supabase. Each agent checks a different dimension
 * of data quality.
 *
 * Usage:
 *   npx tsx scripts/clean-and-import.ts [path-to-csv]
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// ─── Config ───

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CSV Parser ───

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

// ─── Utility ───

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getStateFullName(abbr: string): string {
  const states: Record<string, string> = {
    CA: 'California', NY: 'New York', TX: 'Texas', FL: 'Florida',
    IL: 'Illinois', PA: 'Pennsylvania', OH: 'Ohio', GA: 'Georgia',
    NC: 'North Carolina', MI: 'Michigan', NJ: 'New Jersey', VA: 'Virginia',
    WA: 'Washington', AZ: 'Arizona', MA: 'Massachusetts', CO: 'Colorado',
    OR: 'Oregon', NV: 'Nevada',
  };
  return states[abbr.toUpperCase()] || abbr;
}

// ─── Agent 1: City Name Cleaner ───

interface CleaningResult {
  original: string;
  cleaned: string;
  rule: string;
}

const CITY_CORRECTIONS: Record<string, string> = {
  'alton irvine': 'Irvine',
  'broadway oakland': 'Oakland',
  'broadway redwood city': 'Redwood City',
  'ca irvine': 'Irvine',
  'camino herenica temecula': 'Temecula',
  'd solana beach': 'Solana Beach',
  'diablo road danville': 'Danville',
  'dr. ph1 studio city': 'Studio City',
  'maria': 'Santa Maria',
  'el camino real los altos': 'Los Altos',
  'el camino real palo alto': 'Palo Alto',
  'garstin drive big bear lake': 'Big Bear Lake',
  'gray avenue': 'Yuba City',
  'las santa barbara': 'Santa Barbara',
  "lima's santa fe solana beach": 'Solana Beach',
  'los gamos san rafael': 'San Rafael',
  'helena': 'St. Helena',
  'el camino real encinitas': 'Encinitas',
  'real encinitas': 'Encinitas',
  'na redondo beach': 'Redondo Beach',
  'san diego': 'San Diego',
  'north county san diego': 'San Diego',
  'north manhattan beach': 'Manhattan Beach',
  'north san pedro': 'San Pedro',
  'san vicente los angeles': 'Los Angeles',
  'luis obispo': 'San Luis Obispo',
  's. hope ave. c-105 santa barbara': 'Santa Barbara',
  'springfield campbell': 'Campbell',
  'sunset west hollywood': 'West Hollywood',
  'superior newport beach': 'Newport Beach',
  'the village redondo beach': 'Redondo Beach',
  'valley': 'Mill Valley',
  'ventura ventura': 'Ventura',
  'el camino real sunnyvale': 'Sunnyvale',
  'williamsburg lane chico': 'Chico',
  'your home san francisco': 'San Francisco',
  'cordova': 'Rancho Cordova',
};

// CA zip-to-city fallback map for when city is empty or invalid
const ZIP_TO_CITY: Record<string, string> = {
  '94114': 'San Francisco',
  '91311': 'Chatsworth',
  '95680': 'Clarksburg',
  '95991': 'Yuba City',
  '94941': 'Mill Valley',
};

function agentCleanCity(row: Record<string, string>): CleaningResult | null {
  const city = row.city?.trim();
  if (!city) {
    // Try to infer from zip
    const zip = row.zip?.trim();
    if (zip && ZIP_TO_CITY[zip]) {
      return {
        original: '(empty)',
        cleaned: ZIP_TO_CITY[zip],
        rule: `Inferred from zip ${zip}`,
      };
    }
    return { original: '(empty)', cleaned: 'Unknown', rule: 'No city or zip' };
  }

  const lower = city.toLowerCase();

  // Direct correction map
  if (CITY_CORRECTIONS[lower]) {
    return {
      original: city,
      cleaned: CITY_CORRECTIONS[lower],
      rule: 'Known correction',
    };
  }

  // Fix capitalization (all-caps or all-lowercase)
  if (city === city.toUpperCase() && city.length > 2) {
    const fixed = city
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { original: city, cleaned: fixed, rule: 'Fixed capitalization' };
  }

  if (city === city.toLowerCase() && city.length > 2) {
    const fixed = city
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return { original: city, cleaned: fixed, rule: 'Fixed capitalization' };
  }

  return null;
}

// ─── Agent 2: Phone Validator ───

function agentValidatePhone(phone: string): string | null {
  if (!phone) return null;
  if (phone === '000-000-000') return null;

  // Strip extensions and non-numeric chars for validation
  const base = phone.replace(/\s*EXT.*$/i, '').replace(/[^0-9]/g, '');

  if (base.length < 10) return null;
  if (base.length === 10) return phone;
  if (base.length === 11 && base[0] === '1') return phone;

  // Too many digits = bad data
  if (base.length > 11) return null;

  return phone;
}

// ─── Agent 3: Website Validator ───

const BAD_WEBSITES = [
  'http://nowebsite',
  'http://none',
  'http://wheredidyoustudy',
];

function agentValidateWebsite(website: string): string | null {
  if (!website) return null;

  const lower = website.toLowerCase();

  // Known bad patterns
  for (const bad of BAD_WEBSITES) {
    if (lower.startsWith(bad)) return null;
  }

  // Double protocol
  if (lower.match(/^https?:\/\/https?:\/\//i)) {
    return website.replace(/^https?:\/\//i, '');
  }

  // Semicolon-separated (take first URL)
  if (website.includes(';')) {
    return website.split(';')[0].trim();
  }

  // Parenthetical junk in URL
  if (website.includes('(') && !website.includes('(')) {
    return website.replace(/\(.*\)/, '').trim();
  }

  // .cm instead of .com
  if (website.endsWith('.cm')) {
    return website + 'om';
  }

  return website;
}

// ─── Agent 4: Zip Code Validator (CA-only) ───

function agentValidateZip(zip: string, city: string): string | null {
  if (!zip) return null;

  const cleaned = zip.replace(/\D/g, '');

  // CA zips start with 9
  if (cleaned.length === 5 && cleaned.startsWith('9')) {
    return cleaned;
  }

  // Non-CA zip — still keep it if it was already corrected per data_notes
  if (cleaned.length === 5) {
    return cleaned; // Keep corrected zips from data pipeline
  }

  // Canadian postal code or other junk
  if (zip.match(/[A-Za-z]/)) return null;

  return cleaned.length === 5 ? cleaned : null;
}

// ─── Agent 5: Row Quality Gate ───

interface QualityReport {
  pass: boolean;
  issues: string[];
  severity: 'ok' | 'warning' | 'reject';
}

function agentQualityGate(row: Record<string, string>): QualityReport {
  const issues: string[] = [];

  const name = row.display_name?.trim() || row.provider_name?.trim();
  if (!name) {
    issues.push('Missing provider name');
  }

  const city = row.city?.trim();
  if (!city) {
    issues.push('Missing city');
  }

  if (row.data_quality === 'Needs Review') {
    issues.push('Flagged for review');
  }

  // Suspicious provider names
  if (name && (name.toLowerCase().includes('health mart') || name.toLowerCase().includes('store'))) {
    issues.push('Suspicious provider name — may not be a therapist');
  }

  const severity = issues.length === 0
    ? 'ok'
    : issues.some((i) => i === 'Missing provider name')
      ? 'reject'
      : 'warning';

  return { pass: severity !== 'reject', issues, severity };
}

// ─── Main Pipeline ───

async function main() {
  const csvPath = process.argv[2] || '/Users/kyleschneider/Downloads/CA_Pelvic_Floor_PT_Directory_Final.csv';

  console.log('📂 Reading CSV:', csvPath);
  const rows = parseCSV(csvPath);
  console.log(`📊 Found ${rows.length} records\n`);

  // Run all agents
  const stats = {
    total: rows.length,
    cityCleaned: 0,
    phoneCleaned: 0,
    websiteCleaned: 0,
    zipCleaned: 0,
    rejected: 0,
    warnings: 0,
    inserted: 0,
  };

  const cleanedProviders = [];
  const rejected: { row: number; name: string; reasons: string[] }[] = [];
  const slugCounts: Record<string, number> = {};

  console.log('🔍 Running validation agents...\n');

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // ── Agent 1: City cleaning ──
    const cityResult = agentCleanCity(row);
    if (cityResult) {
      console.log(`  🏙️  City fix [${i + 2}]: "${cityResult.original}" → "${cityResult.cleaned}" (${cityResult.rule})`);
      row.city = cityResult.cleaned;
      stats.cityCleaned++;
    }

    // ── Agent 2: Phone validation ──
    const cleanPhone = agentValidatePhone(row.phone?.trim() || '');
    if (row.phone?.trim() && !cleanPhone) {
      console.log(`  📞 Phone removed [${i + 2}]: "${row.phone}" (invalid)`);
      stats.phoneCleaned++;
    }

    // ── Agent 3: Website validation ──
    const cleanWebsite = agentValidateWebsite(row.website?.trim() || '');
    if (row.website?.trim() && row.website.trim() !== cleanWebsite) {
      if (cleanWebsite) {
        console.log(`  🌐 Website fixed [${i + 2}]: "${row.website}" → "${cleanWebsite}"`);
      } else {
        console.log(`  🌐 Website removed [${i + 2}]: "${row.website}" (invalid)`);
      }
      stats.websiteCleaned++;
    }

    // ── Agent 4: Zip validation ──
    const cleanZip = agentValidateZip(row.zip?.trim() || '', row.city || '');
    if (row.zip?.trim() && row.zip.trim() !== cleanZip) {
      console.log(`  📮 Zip fixed [${i + 2}]: "${row.zip}" → "${cleanZip || 'null'}"`);
      stats.zipCleaned++;
    }

    // ── Agent 5: Quality gate ──
    const quality = agentQualityGate(row);
    if (!quality.pass) {
      rejected.push({
        row: i + 2,
        name: row.display_name || row.provider_name || '(unnamed)',
        reasons: quality.issues,
      });
      stats.rejected++;
      continue;
    }
    if (quality.severity === 'warning') {
      stats.warnings++;
    }

    // ── Build clean record ──
    const city = row.city?.trim() || 'Unknown';
    const state = row.state?.trim() || 'CA';
    const stateSlug = slugify(getStateFullName(state));
    const citySlug = slugify(city);
    const displayName = row.display_name?.trim() || row.provider_name?.trim();

    let baseSlug = slugify(displayName);
    if (!baseSlug) baseSlug = `provider-${i}`;
    slugCounts[baseSlug] = (slugCounts[baseSlug] || 0) + 1;
    const slug = slugCounts[baseSlug] > 1 ? `${baseSlug}-${slugCounts[baseSlug]}` : baseSlug;

    const specialties = row.specialties
      ? row.specialties.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const insurance = row.insurance_accepted
      ? row.insurance_accepted.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    const languages = row.languages
      ? row.languages.split(',').map((s: string) => s.trim()).filter(Boolean)
      : ['English'];

    cleanedProviders.push({
      provider_name: row.provider_name?.trim() || displayName,
      display_name: displayName,
      credentials: row.credentials?.trim() || null,
      title: row.title?.trim() || null,
      practice_name: row.practice_name?.trim() || null,
      bio: row.bio?.trim() || null,
      specialties,
      address: row.address?.trim() || null,
      city,
      state,
      zip: cleanZip || null,
      phone: cleanPhone || null,
      website: cleanWebsite || null,
      email: row.email?.trim() || null,
      linkedin_url: row.linkedin_url?.trim() || null,
      telehealth_available: row.telehealth_available?.toLowerCase() === 'yes',
      insurance_accepted: insurance,
      languages,
      education: row.education?.trim() || null,
      slug,
      city_slug: citySlug,
      state_slug: stateSlug,
    });
  }

  // ── Report ──
  console.log('\n' + '═'.repeat(60));
  console.log('📋 CLEANING REPORT');
  console.log('═'.repeat(60));
  console.log(`  Total records:     ${stats.total}`);
  console.log(`  Cities cleaned:    ${stats.cityCleaned}`);
  console.log(`  Phones cleaned:    ${stats.phoneCleaned}`);
  console.log(`  Websites cleaned:  ${stats.websiteCleaned}`);
  console.log(`  Zips cleaned:      ${stats.zipCleaned}`);
  console.log(`  Warnings:          ${stats.warnings}`);
  console.log(`  Rejected:          ${stats.rejected}`);
  console.log(`  Ready to insert:   ${cleanedProviders.length}`);

  if (rejected.length > 0) {
    console.log('\n⛔ REJECTED RECORDS:');
    rejected.forEach((r) => {
      console.log(`  Row ${r.row}: ${r.name} — ${r.reasons.join(', ')}`);
    });
  }

  // ── Insert ──
  console.log('\n📤 Inserting into Supabase...');

  const batchSize = 50;
  for (let i = 0; i < cleanedProviders.length; i += batchSize) {
    const batch = cleanedProviders.slice(i, i + batchSize);
    const { error } = await supabase.from('providers').upsert(batch, {
      onConflict: 'slug',
    });

    if (error) {
      console.error(`  ❌ Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
    } else {
      stats.inserted += batch.length;
      console.log(`  ✅ Inserted ${stats.inserted}/${cleanedProviders.length}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Done! ${stats.inserted} providers inserted successfully.`);
  console.log('═'.repeat(60));
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
