import { interpretIntent, type IntentInput } from "agent-core/interlock-intent";
import { deliverAmbientMessage } from "./interlock";
import {
  approvalFromSlackInteraction,
  channelMessageFromSlackEvent,
  type SlackEnvelope,
} from "./slack-event";

type AmbientConfig = {
  allowedWorkspaceId: string;
  allowedChannelId: string;
  resourceId: string;
  targetUrl: string;
  candidateRevision: string;
  ownerId: string;
  coordinatorUrl: string;
  token: string;
  botToken: string;
};

export async function openaiIntentModel(prompt: string, request: typeof fetch = fetch) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "stub-replace-me") {
    throw new Error("OPENAI_API_KEY is required for Socket Mode Intent.");
  }
  const response = await request("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: (process.env.MODEL || "gpt-5.4-mini-2026-03-17").trim(),
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status}).`);
  }
  const body = await response.json() as { choices?: { message?: { content?: string } }[] };
  return JSON.parse(body.choices?.[0]?.message?.content ?? "null");
}

export async function handleSocketEnvelope(
  envelope: SlackEnvelope,
  config: AmbientConfig,
  deps: {
    ingress?: typeof deliverAmbientMessage;
    model?: (prompt: string) => Promise<unknown>;
    request?: typeof fetch;
  } = {},
) {
  const approval = approvalFromSlackInteraction(envelope);
  const request = deps.request ?? fetch;
  if (approval) {
    if (
      approval.workspaceId !== config.allowedWorkspaceId ||
      approval.channelId !== config.allowedChannelId
    ) {
      return "ignored";
    }
    const response = await request(`${config.coordinatorUrl}/v1/slack/approve`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(approval),
      signal: AbortSignal.timeout(2_000),
    });
    const approved = response.ok;
    await request(approved && approval.cardTs
      ? "https://slack.com/api/chat.update"
      : "https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.botToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        channel: config.allowedChannelId,
        ...(approved && approval.cardTs
          ? { ts: approval.cardTs, blocks: [] }
          : approval.threadRef ? { thread_ts: approval.threadRef } : {}),
        text: approved
          ? `✓ <@${approval.actorId}> approved ${approval.candidateRevision}. Interlock is observing the hold — follow it in Control Room.`
          : `<@${approval.actorId}> approval was not accepted. The card is stale, already used, or you are not the configured owner.`,
      }),
      signal: AbortSignal.timeout(5_000),
    });
    return approved ? "approved" : "approval_rejected";
  }

  const mapped = channelMessageFromSlackEvent(envelope, config.allowedChannelId);
  if (!mapped) return "ignored";
  const context = await (deps.ingress ?? deliverAmbientMessage)(
    mapped.message,
    mapped.conversationKey,
    config,
  );
  if (!context) return "ignored";
  const source = context.at(-1)!;
  const intent: IntentInput = {
    messages: context.map((message) => ({
      deliveryId: message.deliveryId,
      messageRef: `${message.channelId}:${message.logicalMessageId}`,
      actorId: message.actorId,
      text: message.text,
    })),
    resource: {
      resourceId: config.resourceId,
      targetUrl: config.targetUrl,
      candidateRevision: config.candidateRevision,
      ownerId: config.ownerId,
    },
  };
  const output = await interpretIntent(intent, deps.model ?? openaiIntentModel);
  if (output.kind === "abstain") return `abstained:${output.reason}`;
  const proposal = await request(`${config.coordinatorUrl}/v1/slack/proposals`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      workspaceId: config.allowedWorkspaceId,
      channelId: config.allowedChannelId,
      resourceId: output.resourceId,
      targetUrl: output.targetUrl,
      candidateRevision: output.candidateRevision,
      threadRef: source.threadRef,
      threshold: output.threshold,
      windowMs: output.windowMs,
      sourceDeliveryIds: output.sourceDeliveryIds,
      boundedContext: intent.messages,
    }),
    signal: AbortSignal.timeout(2_000),
  });
  if (!proposal.ok) return "proposal_rejected";
  const card = await proposal.json() as {
    workflowId: string;
    revision: number;
    resourceId: string;
    candidateRevision: string;
    cardToken: string;
    condition: string;
  };
  const posted = await request("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      authorization: `Bearer ${config.botToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      channel: config.allowedChannelId,
      thread_ts: source.threadRef,
      text: `<@${config.ownerId}> approval needed · revision ${card.revision}`,
      blocks: [
        {
          type: "header",
          text: { type: "plain_text", text: `Interlock approval · revision ${card.revision}` },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<@${config.ownerId}> — *Hold ${card.candidateRevision}* on ${card.resourceId}\n\n${card.condition}`,
          },
        },
        {
          type: "actions",
          elements: [{
            type: "button",
            action_id: "interlock_approve",
            style: "primary",
            text: { type: "plain_text", text: `Yes — approve ${card.candidateRevision}` },
            value: JSON.stringify({
              workflowId: card.workflowId,
              revision: card.revision,
              resourceId: card.resourceId,
              candidateRevision: card.candidateRevision,
              cardToken: card.cardToken,
            }),
          }],
        },
      ],
    }),
    signal: AbortSignal.timeout(5_000),
  });
  const postedBody = await posted.json() as { ok?: boolean };
  return postedBody.ok ? "proposed" : "post_failed";
}
