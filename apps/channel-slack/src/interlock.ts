import type { ChannelMessage } from "@copilotkit/channels";
import type { SourceMessage } from "agent-core/interlock";

export function ambientSourceMessage(
  message: ChannelMessage,
  conversationKey: string,
  allowedChannelId: string,
): SourceMessage | null {
  const separator = conversationKey.indexOf("::");
  if (separator < 1) return null;
  const channelId = conversationKey.slice(0, separator);
  const threadRef = conversationKey.slice(separator + 2);
  if (
    channelId !== allowedChannelId ||
    message.actor.kind !== "human" ||
    !message.actor.id ||
    message.operation.kind === "deleted" ||
    !message.text.trim()
  ) {
    return null;
  }
  return {
    deliveryId:
      message.deliveryId ??
      message.eventId ??
      message.operation.revisionId,
    logicalMessageId: message.operation.logicalMessageId,
    revisionId: message.operation.revisionId,
    channelId,
    threadRef,
    actorId: message.actor.id,
    text: message.text.trim().slice(0, 1_000),
    updated: message.operation.kind === "updated",
  };
}

export async function deliverAmbientMessage(
  message: ChannelMessage,
  conversationKey: string,
  config: {
    allowedChannelId: string;
    coordinatorUrl: string;
    token: string;
  },
) {
  const source = ambientSourceMessage(
    message,
    conversationKey,
    config.allowedChannelId,
  );
  if (!source) return false;
  const response = await fetch(`${config.coordinatorUrl}/v1/slack/events`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(source),
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) {
    throw new Error(`Coordinator rejected Slack delivery (${response.status}).`);
  }
  return true;
}
