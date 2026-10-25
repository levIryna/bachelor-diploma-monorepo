type QueryParamValue = string | number | boolean | null | undefined;

/** Turns `{ limit: 5, year: 2024 }` into `?limit=5&year=2024`. Empty when every value is null or undefined. */
export function toQueryString(params: Record<string, QueryParamValue>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.append(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}
