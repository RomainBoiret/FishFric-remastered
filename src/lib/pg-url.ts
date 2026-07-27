/**
 * pg v8 treats sslmode=require as verify-full and emits a warning.
 * uselibpqcompat=true aligns with libpq and silences the noise.
 */
export function withPgSslCompat(connectionString: string): string {
  try {
    const url = new URL(connectionString);
    if (!url.searchParams.has("uselibpqcompat")) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    if (!url.searchParams.has("sslmode")) {
      url.searchParams.set("sslmode", "require");
    }
    return url.toString();
  } catch {
    return connectionString;
  }
}
