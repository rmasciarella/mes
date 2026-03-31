if (typeof window === "undefined") {
  const { dirname, resolve } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const { config } = await import("@dotenvx/dotenvx");

  config({
    path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env"),
  });
}
