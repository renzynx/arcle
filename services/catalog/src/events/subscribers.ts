import {
  SETTINGS_EVENTS,
  SigningConfigChangedPayload,
  USER_EVENTS,
  UserCreatedPayload,
  UserDeletedPayload,
} from "@arcle/events";
import { getPubSub } from "@arcle/events/pubsub";
import { createLogger } from "@arcle/logger";
import { clearSigningConfigCache } from "../lib/urls.ts";

const log = createLogger({ name: "catalog:events" });

export function setupSubscribers() {
  const pubsub = getPubSub();

  pubsub.subscribe(USER_EVENTS.CREATED, UserCreatedPayload, (payload) => {
    log.info(`User created: ${payload.id} ${payload.email}`);
  });

  pubsub.subscribe(USER_EVENTS.DELETED, UserDeletedPayload, (payload) => {
    log.info(`User deleted: ${payload.id}`);
  });

  pubsub.subscribe(
    SETTINGS_EVENTS.SIGNING_CONFIG_CHANGED,
    SigningConfigChangedPayload,
    () => {
      log.info("Signing config changed, clearing in-memory cache");
      clearSigningConfigCache();
    },
  );
}
