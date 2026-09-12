import { createChannel } from "@copilotkit/channels";
import type { ChannelHandler } from "@copilotkit/channels";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { resolveModel } from "agent-core";
import {
  boundedIntentInput,
  type IntentInput,
} from "agent-core/interlock-intent";
import { required } from "./env";
import { welcomeMessage } from "./components";
import { interlockApproval, interlockProposal } from "./approval";
import { deliverAmbientMessage } from "./interlock";

const ambientConfig = {
  allowedWorkspaceId: required("INTERLOCK_SLACK_WORKSPACE_ID"),
  allowedChannelId: required("INTERLOCK_SLACK_CHANNEL_ID"),
  resourceId: required("INTERLOCK_RESOURCE_ID"),
  targetUrl: required("INTERLOCK_TARGET_URL"),
  candidateRevision: required("INTERLOCK_TARGET_REVISION"),
  ownerId: required("INTERLOCK_OWNER_ID"),
  coordinatorUrl: required("INTERLOCK_COORDINATOR_URL"),
  token: required("INTERLOCK_COORDINATOR_TOKEN"),
};
const approval = interlockApproval(ambientConfig);
const proposal = interlockProposal(ambientConfig);

function makeInterlockAgent(threadId: string) {
  const agent = new BuiltInAgent({
    model: resolveModel(),
    prompt:
      "Call resolve_interlock_intent exactly once with the requested Intent output. Emit no other text.",
    maxSteps: 3,
    toolChoice: "required",
  });
  agent.threadId = threadId;
  return agent;
}

export const channel = createChannel({
  // Must equal the Channel Code in Intelligence, character for character. A
  // mismatch leaves the Channel at "Waiting for runtime" and is validated at
  // startup, not here.
  name: required("CHANNEL_CODE"),

  // Required. "platform" derives the canonical user from provider + workspace +
  // platform user id. Do NOT move this onto CopilotRuntime — that one is for
  // web requests and must be absent on a Channels-only runtime.
  identifyUser: "platform",

  agent: makeInterlockAgent,
  tools: [proposal],
  components: [approval],
  store: { concurrency: "serial", dedupTtl: 300_000 },
});

type AmbientConfig = typeof ambientConfig;

export async function routeAmbientMessage(
  { thread, message }: Parameters<ChannelHandler>[0],
  config: AmbientConfig,
  ingress = deliverAmbientMessage,
) {
  const source = await ingress(
    message,
    thread.conversationKey,
    config,
  );
  if (!source) return;
  const intent: IntentInput = {
    messages: [{
      deliveryId: source.deliveryId,
      messageRef: `${source.channelId}:${source.logicalMessageId}`,
      actorId: source.actorId,
      text: source.text,
    }],
    resource: {
      resourceId: config.resourceId,
      targetUrl: config.targetUrl,
      candidateRevision: config.candidateRevision,
      ownerId: config.ownerId,
    },
  };
  await thread.setState({
    interlockThreadRef: source.threadRef,
    interlockIntent: intent,
  });
  await thread.runAgent({ prompt: boundedIntentInput(intent) });
}

const deliver: ChannelHandler = (context) =>
  routeAmbientMessage(context, ambientConfig);

// A mention has no special authority or activation semantics. Both hooks feed
// the same bounded, deduplicated coordinator ingress.
channel.onMention(deliver);
channel.onMessage(deliver);

channel.onWelcome(async ({ thread, platform }) => {
  await thread.post(welcomeMessage(platform));
});
