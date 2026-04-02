/**
 * Centralized route builder for all keyword-rich SEO URLs.
 *
 * All internal links should use these helpers instead of hardcoding paths.
 * This ensures consistency and makes future URL changes trivial.
 */

import { slugify } from './utils';

// ─── State-level routes ───

export function stateRoute(stateSlug: string) {
  return `/${stateSlug}/pelvic-floor-physical-therapy`;
}

export function stateSpecialtiesRoute(stateSlug: string) {
  return `/${stateSlug}/pelvic-floor-therapy-specialties`;
}

export function stateTelehealthRoute(stateSlug: string) {
  return `/${stateSlug}/telehealth-pelvic-floor-pt`;
}

export function stateInsuranceRoute(stateSlug: string) {
  return `/${stateSlug}/pelvic-floor-pt-insurance`;
}

export function stateSpecialtyRoute(stateSlug: string, specialtySlug: string) {
  return `/${stateSlug}/${specialtySlug}-therapy`;
}

// ─── City-level routes ───

export function cityRoute(stateSlug: string, citySlug: string) {
  return `/${stateSlug}/${citySlug}/pelvic-floor-physical-therapy`;
}

export function cityTelehealthRoute(stateSlug: string, citySlug: string) {
  return `/${stateSlug}/${citySlug}/telehealth-pelvic-floor-pt`;
}

export function citySpecialtyRoute(stateSlug: string, citySlug: string, specialtySlug: string) {
  return `/${stateSlug}/${citySlug}/${specialtySlug}-therapy`;
}

export function cityInsuranceRoute(stateSlug: string, citySlug: string, insuranceSlug: string) {
  return `/${stateSlug}/${citySlug}/${insuranceSlug}-pelvic-floor-pt`;
}

// ─── Provider route (unchanged — no keyword stuffing on provider pages) ───

export function providerRoute(stateSlug: string, citySlug: string, providerSlug: string) {
  return `/${stateSlug}/${citySlug}/${providerSlug}`;
}

// ─── Global specialty routes ───

export function specialtiesIndexRoute() {
  return '/pelvic-floor-therapy-specialties';
}

export function specialtyRoute(specialtySlug: string) {
  return `/${specialtySlug}-physical-therapy`;
}
