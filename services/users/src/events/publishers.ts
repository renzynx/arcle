import {
  USER_EVENTS,
  type UserCreatedPayload,
  type UserDeletedPayload,
  type UserUpdatedPayload,
} from "@arcle/events";
import { getPubSub } from "@arcle/events/pubsub";

export async function publishUserCreated(payload: UserCreatedPayload) {
  await getPubSub().publish(USER_EVENTS.CREATED, payload);
}

export async function publishUserUpdated(payload: UserUpdatedPayload) {
  await getPubSub().publish(USER_EVENTS.UPDATED, payload);
}

export async function publishUserDeleted(payload: UserDeletedPayload) {
  await getPubSub().publish(USER_EVENTS.DELETED, payload);
}
