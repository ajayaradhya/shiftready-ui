// Greater Sydney suburb dataset (name · postcode · centroid).
// Source: matthewproctor/australianpostcodes (MIT), filtered to Greater Sydney
// SA4 regions. Regenerate via the script in scripts/ if the source updates.

import raw from "@/data/sydney-suburbs.json";

export interface Suburb {
  name: string;
  postcode: string;
  lat: number;
  lng: number;
}

export const SYDNEY_SUBURBS: Suburb[] = raw as Suburb[];

/** Sorted unique suburb names for dropdowns. */
export const SYDNEY_SUBURB_NAMES: string[] = SYDNEY_SUBURBS.map(s => s.name);

const byName = new Map<string, Suburb>(
  SYDNEY_SUBURBS.map(s => [s.name.toLowerCase(), s])
);

const byPostcode = new Map<string, Suburb[]>();
for (const s of SYDNEY_SUBURBS) {
  const list = byPostcode.get(s.postcode);
  if (list) list.push(s);
  else byPostcode.set(s.postcode, [s]);
}

export function suburbByName(name: string): Suburb | undefined {
  return byName.get(name.trim().toLowerCase());
}

/** Suburbs sharing a 4-digit postcode (sorted by name). */
export function suburbsForPostcode(postcode: string): Suburb[] {
  return (byPostcode.get(postcode.trim()) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function isValidPostcode(postcode: string): boolean {
  return /^\d{4}$/.test(postcode.trim());
}

// Equirectangular approximation — fine at city scale, far cheaper than haversine.
function distanceSq(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const meanLat = ((lat1 + lat2) / 2) * (Math.PI / 180);
  const x = (lng2 - lng1) * Math.cos(meanLat);
  const y = lat2 - lat1;
  return x * x + y * y;
}

/** Nearest suburb to a coordinate (used for browser geolocation). */
export function nearestSuburb(lat: number, lng: number): Suburb {
  let best = SYDNEY_SUBURBS[0];
  let bestDist = Infinity;
  for (const s of SYDNEY_SUBURBS) {
    const d = distanceSq(lat, lng, s.lat, s.lng);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return best;
}
