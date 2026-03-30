import { type LinkComponentProps, type NavigateOptions } from "@tanstack/react-router";
import type React from "react";

import { type LOCALE_ROUTE_PREFIX } from "#@/tanstack-start/constants/index";

export type StripLocalePrefix<T> = T extends string ? RemoveLocaleFromString<T> : T;

type To = StripLocalePrefix<LinkComponentProps["to"]>;
type NavigateTo = Exclude<StripLocalePrefix<NavigateOptions["to"]>, undefined>;

type CollapseDoubleSlashes<TString extends string> = TString extends `${infer H}//${infer T}`
  ? CollapseDoubleSlashes<`${H}/${T}`>
  : TString;

type LocalizedLinkProps = {
  to?: To;
} & Omit<LinkComponentProps, "to">;

type LocalizedNavigateOptions = Omit<
  // oxlint-disable-next-line typescript-eslint(no-explicit-any)
  NavigateOptions<any, any, NavigateTo>,
  "to" | "from"
> & {
  to: NavigateTo;
  from?: NavigateTo;
};

// Helpers
type RemoveAll<
  TString extends string,
  TSub extends string,
> = TString extends `${infer H}${TSub}${infer T}` ? RemoveAll<`${H}${T}`, TSub> : TString;

type RemoveLocaleFromString<TString extends string> = CollapseDoubleSlashes<
  RemoveAll<TString, typeof LOCALE_ROUTE_PREFIX>
>;

// Internal link props (TanStack Router)
type InternalLinkProps = LocalizedLinkProps & {
  href?: never;
};

// External link props (native anchor)
type ExternalLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href" | "children"
> & {
  href: string;
  to?: never;
  params?: never;
  children?:
    | React.ReactNode
    | ((props: { isActive: boolean; isTransitioning: boolean }) => React.ReactNode);
};

export type LinkProps = InternalLinkProps | ExternalLinkProps;
export type NavigateProps = LocalizedNavigateOptions;
export type { NavigateTo, To };

// Hook return type
export type LocalizedNavigate = {
  <TRelaxedTo extends string = string>(
    opts:
      | NavigateProps
      | {
          to: TRelaxedTo;
          replace?: boolean;
          resetScroll?: boolean;
          [key: string]: unknown;
        },
  ): Promise<void>;
};
