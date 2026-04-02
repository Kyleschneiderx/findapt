import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getStateFullName(abbr: string): string {
  const states: Record<string, string> = {
    CA: 'California', NY: 'New York', TX: 'Texas', FL: 'Florida',
  };
  return states[abbr.toUpperCase()] || abbr;
}

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

async function importCSV() {
  const csvPath = process.argv[2] || path.join(__dirname, '..', 'data', 'CA_Pelvic_Floor_PT_Directory_Final.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim());
  const headers = parseCSVLine(lines[0]);

  console.log(`Found ${lines.length - 1} records`);
  console.log('Headers:', headers);

  const providers = [];
  const slugCounts: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = fields[idx] || '';
    });

    const city = row.city?.trim() || 'Unknown';
    const state = row.state?.trim() || 'CA';
    const stateSlug = slugify(getStateFullName(state));
    const citySlug = slugify(city);

    let baseSlug = slugify(row.display_name || row.provider_name);
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

    const telehealth = row.telehealth_available?.toLowerCase() === 'yes';

    const phone = row.phone?.trim();
    const validPhone = phone && phone !== '000-000-000' ? phone : null;

    providers.push({
      provider_name: row.provider_name?.trim(),
      display_name: row.display_name?.trim() || row.provider_name?.trim(),
      credentials: row.credentials?.trim() || null,
      title: row.title?.trim() || null,
      practice_name: row.practice_name?.trim() || null,
      bio: row.bio?.trim() || null,
      specialties,
      address: row.address?.trim() || null,
      city,
      state,
      zip: row.zip?.trim() || null,
      phone: validPhone,
      website: row.website?.trim() || null,
      email: row.email?.trim() || null,
      linkedin_url: row.linkedin_url?.trim() || null,
      telehealth_available: telehealth,
      insurance_accepted: insurance,
      languages,
      education: row.education?.trim() || null,
      slug,
      city_slug: citySlug,
      state_slug: stateSlug,
    });
  }

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < providers.length; i += batchSize) {
    const batch = providers.slice(i, i + batchSize);
    const { error } = await supabase.from('providers').upsert(batch, {
      onConflict: 'slug',
    });

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${providers.length}`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} providers.`);
}

importCSV().catch(console.error);
