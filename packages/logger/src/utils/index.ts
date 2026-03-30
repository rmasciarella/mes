// RFC 7239 Forwarded header parsing - extracts IP from "for=" parameter
const FORWARDED_FOR_REGEX = /for=([^;,\s]+)/;

// Normalize IP addresses for consistent comparison, especially for IPv4-mapped IPv6 addresses
const IPV6_PREFIX_REGEX = /^::ffff:/i;

/**
 * Get real client IP from proxy headers, checking common headers used by various proxies.
 * Priority order: most specific/trustworthy first, then fallback.
 */
export function getRealIpFromHeaders(headers: Headers): string | undefined {
  return (
    headers.get("cf-connecting-ip") ?? // Cloudflare
    headers.get("true-client-ip") ?? // Cloudflare Enterprise, Akamai
    headers.get("x-real-ip") ?? // Nginx, Caddy
    headers.get("x-client-ip") ?? // Various proxies
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? // Standard proxy chain
    headers.get("forwarded")?.match(FORWARDED_FOR_REGEX)?.[1] // RFC 7239
  );
}

/**
 * Normalize IPv6-mapped IPv4 addresses to plain IPv4 format
 * Example: "::ffff:127.0.0.1" is transformed into "127.0.0.1"
 */
export function normalizeIp(ip: string | undefined): string | undefined {
  if (!ip) {
    return undefined;
  }
  return ip.replace(IPV6_PREFIX_REGEX, "");
}
