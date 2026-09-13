import type { ChannelMessage } from "@copilotkit/channels";

export function slackAppToken(env: NodeJS.ProcessEnv = process.env) {
  return [
    env.INTERLOCK_SLACK_APP_TOKEN,
    env.SLACK_APP_TOKEN,
    env.INTELLIGENCE_CHANNEL_INTERLOCK_SLACK_APP_TOKEN,
  ].find((value) => value?.startsWith("xapp-")) ?? "";
}

export function slackBotToken(env: NodeJS.ProcessEnv = process.env) {
  return env.INTELLIGENCE_CHANNEL_INTERLOCK_SLACK_BOT_TOKEN ||
    env.INTERLOCK_SLACK_BOT_TOKEN ||
    "";
}

type SlackMessage = {
  type?: string;
  channel?: string;
  user?: string;
  text?: string;
  ts?: string;
  thread_ts?: string;
  subtype?: string;
  bot_id?: string;
  hidden?: boolean;
  message?: SlackMessage;
};

export type SlackEnvelope = {
  envelope_id?: string;
  type?: string;
  payload?: {
    type?: string;
    team_id?: string;
    event_id?: string;
    event?: SlackMessage;
    team?: { id?: string };
    user?: { id?: string };
    channel?: { id?: string };
    container?: { message_ts?: string };
    message?: { thread_ts?: string };
    actions?: { action_id?: string; value?: string }[];
  };
};

export function channelMessageFromSlackEvent(
  envelope: SlackEnvelope,
  allowedChannelId: string,
): { message: ChannelMessage; conversationKey: string } | null {
  const event = envelope.payload?.event;
  if (!event || event.type !== "message") return null;
  const inner = event.subtype === "message_changed" ? event.message : event;
  if (!inner) return null;
  if (
    inner.bot_id ||
    event.subtype === "bot_message" ||
    event.subtype === "message_deleted" ||
    inner.hidden
  ) {
    return null;
  }
  const channelId = event.channel ?? "";
  if (channelId !== allowedChannelId) return null;
  const user = inner.user ?? "";
  const text = inner.text?.trim() ?? "";
  const ts = inner.ts ?? "";
  if (!user || !text || !ts) return null;
  const workspaceId = envelope.payload?.team_id ?? "";
  const threadRoot = inner.thread_ts || ts;
  const edited = event.subtype === "message_changed";
  return {
    conversationKey: `${channelId}::${threadRoot}`,
    message: {
      text,
      user: { id: `slack:${workspaceId}:${user}`, name: user },
      actor: { id: user, kind: "human" },
      ref: { id: `${channelId}:${ts}` },
      platform: "slack",
      operation: {
        kind: edited ? "updated" : "created",
        logicalMessageId: ts,
        revisionId: `${ts}:${envelope.payload?.event_id ?? ts}`,
        mentioned: /<@[^>]+>/.test(text),
      },
      deliveryId: envelope.payload?.event_id ?? ts,
    },
  };
}

export function approvalFromSlackInteraction(envelope: SlackEnvelope) {
  const payload = envelope.payload;
  if (payload?.type !== "block_actions") return null;
  const action = payload.actions?.find((item) => item.action_id === "interlock_approve");
  if (!action?.value) return null;
  try {
    const value = JSON.parse(action.value) as Record<string, unknown>;
    if (
      typeof value.workflowId !== "string" ||
      typeof value.revision !== "number" ||
      typeof value.resourceId !== "string" ||
      typeof value.candidateRevision !== "string" ||
      typeof value.cardToken !== "string"
    ) {
      return null;
    }
    return {
      workflowId: value.workflowId,
      revision: value.revision,
      resourceId: value.resourceId,
      candidateRevision: value.candidateRevision,
      cardToken: value.cardToken,
      actorId: payload.user?.id ?? "",
      workspaceId: payload.team?.id ?? "",
      channelId: payload.channel?.id ?? "",
      threadRef: payload.message?.thread_ts ?? payload.container?.message_ts ?? "",
      cardTs: payload.container?.message_ts ?? "",
    };
  } catch {
    return null;
  }
}
