import { type AnyRedirect } from "@tanstack/react-router";
import { redirect as rawRedirect } from "@tanstack/react-router";

import { baseLocale, getLocale } from "#@/paraglide/runtime";
import { type NavigateTo } from "#@/tanstack-start/types/index";

const LOCALE_ROUTE_PREFIX = "{-$locale}" as const;

type LocalizedRedirectOpts = {
  to: NavigateTo;
  params?: Record<string, unknown>;
  search?: Record<string, unknown>;
  hash?: string;
  replace?: boolean;
  code?: number;
  headers?: Record<string, string>;
  from?: string;
  throw?: boolean;
} & Record<string, unknown>;

/**
 * Localized redirect helper similar to Link and useNavigate.
 * Automatically prepends the locale route prefix and adds locale to params.
 */
export function redirect(opts: LocalizedRedirectOpts): AnyRedirect {
  const locale = getLocale();

  // oxlint-disable-next-line typescript-eslint(no-explicit-any)
  const localizedTo = `/${LOCALE_ROUTE_PREFIX}${opts.to}` as any;

  return rawRedirect({
    ...opts,
    params: {
      locale: locale === baseLocale ? undefined : locale,
      ...(typeof opts.params === "object" ? opts.params : {}),
    },
    to: localizedTo,
    // oxlint-disable-next-line typescript-eslint(no-explicit-any)
  } as any);
}
