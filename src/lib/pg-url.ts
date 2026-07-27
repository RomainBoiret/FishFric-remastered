/**
 * pg v8 traite sslmode=require comme verify-full et émet un warning.
 * uselibpqcompat=true aligne le comportement sur libpq et coupe le bruit.
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
