import { type NavigateOptions } from "@tanstack/react-router";
import { useNavigate as rawUseNavigate } from "@tanstack/react-router";

import { baseLocale, getLocale } from "#@/paraglide/runtime";
import { LOCALE_ROUTE_PREFIX } from "#@/tanstack-start/constants/index";
import {
  type LocalizedNavigate,
  type NavigateProps,
  type NavigateTo,
} from "#@/tanstack-start/types/index";
import { stripLocalePrefix } from "#@/tanstack-start/utils/strip-locale-prefix";

export function useNavigate(_defaultOpts?: { from?: NavigateTo }) {
  const navigate = rawUseNavigate(
    _defaultOpts?.from
      ? {
          from: `/${LOCALE_ROUTE_PREFIX}${_defaultOpts.from}` as NavigateOptions["from"],
        }
      : undefined,
  );

  const locale = getLocale();

  const localizedNavigate: LocalizedNavigate = <TRelaxedTo extends string = string>(
    args:
      | NavigateProps
      | {
          to: TRelaxedTo;
          replace?: boolean;
          resetScroll?: boolean;
          // oxlint-disable-next-line typescript-eslint(no-explicit-any)
          [key: string]: any;
        },
  ) => {
    const { to, params, ...rest } = args;

    // Strip any existing locale prefix to avoid duplication
    const cleanTo = stripLocalePrefix(to as string);
    const localizedTo = `/${LOCALE_ROUTE_PREFIX}${cleanTo}` as NavigateOptions["to"];

    return navigate({
      params: {
        locale: locale === baseLocale ? undefined : locale,
        ...(typeof params === "object" ? params : {}),
      },
      to: localizedTo,
      ...rest,
    });
  };

  return localizedNavigate;
}
