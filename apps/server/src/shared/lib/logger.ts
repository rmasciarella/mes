import { configureLogger } from "@tsu-stack/logger/server";

void (async () => {
  await configureLogger();
})();
