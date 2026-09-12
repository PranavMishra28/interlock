import type { ChannelMessage } from "@copilotkit/channels";
import type { SourceMessage } from "agent-core/interlock";

export function isAllowedSlackActor(
  userId: string | null | undefined,
  actor: ChannelMessage["actor"],
  workspaceId: string,
) {
  return (
    actor.kind === "human" &&
    Boolean(actor.id) &&
    userId === `slack:${workspaceId}:${actor.id}`
  );
}

export function ambientSourceMessage(
  message: ChannelMessage,
  conversationKey: string,
  allowedWorkspaceId: string,
  allowedChannelId: string,
): SourceMessage | null {
  const separator = conversationKey.indexOf("::");
  if (separator < 1) return null;
  const channelId = conversationKey.slice(0, separator);
  const threadRef = conversationKey.slice(separator + 2);
  if (
    channelId !== allowedChannelId ||
    !isAllowedSlackActor(message.user?.id, message.actor, allowedWorkspaceId) ||
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
    workspaceId: allowedWorkspaceId,
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
    allowedWorkspaceId: string;
    allowedChannelId: string;
    coordinatorUrl: string;
    token: string;
    request?: typeof fetch;
  },
) {
  const source = ambientSourceMessage(
    message,
    conversationKey,
    config.allowedWorkspaceId,
    config.allowedChannelId,
  );
  if (!source) return false;
  const response = await (config.request ?? fetch)(`${config.coordinatorUrl}/v1/slack/events`, {
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
  return response.status === 201 ? source : null;
}

export async function reportListenerHeartbeat(config: {
  allowedWorkspaceId: string;
  allowedChannelId: string;
  coordinatorUrl: string;
  token: string;
}, online: boolean) {
  const response = await fetch(`${config.coordinatorUrl}/v1/slack/heartbeat`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      workspaceId: config.allowedWorkspaceId,
      channelId: config.allowedChannelId,
      online,
    }),
    signal: AbortSignal.timeout(2_000),
  });
  if (!response.ok) {
    throw new Error(`Coordinator rejected listener heartbeat (${response.status}).`);
  }
}
