const FLAGS = {
  MARKETPLACE_SEARCH: process.env.NEXT_PUBLIC_FF_MARKETPLACE_SEARCH !== "false",
  CONCIERGE_NAV: process.env.NEXT_PUBLIC_FF_CONCIERGE_NAV === "true",
  FINANCES_NAV: process.env.NEXT_PUBLIC_FF_FINANCES_NAV === "true",
  POSTHOG_ANALYTICS: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
  SENTRY_MONITORING: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
} as const;

export type Flag = keyof typeof FLAGS;

export function isEnabled(flag: Flag): boolean {
  return FLAGS[flag];
}
