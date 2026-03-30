/**
 * Needed to allow importing CSS files and font files without TypeScript errors
 * @see {@link https://github.com/fontsource/fontsource/issues/1038}
 */
declare module "*.css";
declare module "@fontsource/*" {}
declare module "@fontsource-variable/*" {}
