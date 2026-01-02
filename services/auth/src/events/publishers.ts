import { USER_EVENTS, type UserCreatedPayload } from "@arcle/events";
import { tryGetPubSub } from "@arcle/events/pubsub";

export async function publishUserCreated(payload: UserCreatedPayload) {
  const pubsub = tryGetPubSub();
  if (!pubsub) return;
  await pubsub.publish(USER_EVENTS.CREATED, payload);
}
