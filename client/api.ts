export async function api<T>(path: string, params: Record<string, string | number> = {}) {
  const response = await fetch(
    '/api/' +
      path +
      '?' +
      new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])),
  );
  if (!response.ok) {
    throw Error('No se pudo obtener la información.');
  }
  return response.json() as Promise<T>;
}
