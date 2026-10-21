/**
 * Hosts that serve the public site. Every other address — the wip.gregfrye.us
 * review subdomain, *.vercel.app previews, local dev — is a review surface:
 * same build, but marked noindex so it never competes with the real domain.
 * Keyed by host rather than VERCEL_ENV so it holds however domains are attached.
 */
export const publicHosts = ["gregfrye.us", "www.gregfrye.us"];

export function isPublicHost(host: string | null | undefined): boolean {
  return publicHosts.includes((host ?? "").split(":")[0].toLowerCase());
}
