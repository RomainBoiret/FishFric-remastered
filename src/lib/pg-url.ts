/**
 * pg v8 treats sslmode=require as verify-full and emits a warning.
 * uselibpqcompat=true aligns with libpq and silences the noise.
 *
 * Does not invent an sslmode — callers keep Neon (`sslmode=require`) or
 * local/CI Postgres (no SSL / `sslmode=disable`) as provided.
 */
export function withPgSslCompat(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (
      url.searchParams.has("sslmode") &&
      !url.searchParams.has("uselibpqcompat")
    ) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
