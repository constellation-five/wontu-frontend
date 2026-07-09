export interface NormalizedAddressComponent {
  text: string;
  types: string[];
}

export function fromGeocoderComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined,
): NormalizedAddressComponent[] {
  return (components ?? []).map((c) => ({ text: c.long_name, types: c.types }));
}

export function fromPlaceComponents(
  components: google.maps.places.AddressComponent[] | undefined,
): NormalizedAddressComponent[] {
  return (components ?? [])
    .filter((c) => !!c.longText)
    .map((c) => ({ text: c.longText as string, types: c.types }));
}

// Address components come back as ~10 nested subdivisions (RT/RW, kelurahan,
// kecamatan, kota, province, postal code, country...). Collapse that down to
// just "street (+ number), city" — the level of detail people actually read.
export function buildShortAddress(components: NormalizedAddressComponent[]): string | null {
  const findByType = (type: string) => components.find((c) => c.types.includes(type))?.text;

  const route = findByType('route');
  const streetNumber = findByType('street_number');
  const street =
    [route, streetNumber].filter(Boolean).join(' ') ||
    findByType('sublocality_level_1') ||
    findByType('sublocality') ||
    findByType('neighborhood');

  const city =
    findByType('locality') ||
    findByType('administrative_area_level_2') ||
    findByType('administrative_area_level_1');

  const parts = [street, city].filter((part): part is string => !!part?.trim());
  return parts.length > 0 ? parts.join(', ') : null;
}
