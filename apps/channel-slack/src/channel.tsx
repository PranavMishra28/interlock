import { createChannel } from "@copilotkit/channels";
import type { ChannelHandler } from "@copilotkit/channels";
import { required } from "./env";
import { welcomeMessage } from "./components";
import { interlockApproval } from "./approval";
import { deliverAmbientMessage } from "./interlock";

const ambientConfig = {
  allowedWorkspaceId: required("INTERLOCK_SLACK_WORKSPACE_ID"),
  allowedChannelId: required("INTERLOCK_SLACK_CHANNEL_ID"),
  coordinatorUrl: required("INTERLOCK_COORDINATOR_URL"),
  token: required("INTERLOCK_COORDINATOR_TOKEN"),
};

export const channel = createChannel({
  // Must equal the Channel Code in Intelligence, character for character. A
  // mismatch leaves the Channel at "Waiting for runtime" and is validated at
  // startup, not here.
  name: required("CHANNEL_CODE"),

  // Required. "platform" derives the canonical user from provider + workspace +
  // platform user id. Do NOT move this onto CopilotRuntime — that one is for
  // web requests and must be absent on a Channels-only runtime.
  identifyUser: "platform",

  components: [interlockApproval(ambientConfig)],
  store: { concurrency: "serial", dedupTtl: 300_000 },
});

const deliver: ChannelHandler = async ({
  thread,
  message,
}) => {
  await deliverAmbientMessage(message, thread.conversationKey, ambientConfig);
};

// A mention has no special authority or activation semantics. Both hooks feed
// the same bounded, deduplicated coordinator ingress.
channel.onMention(deliver);
channel.onMessage(deliver);

channel.onWelcome(async ({ thread, platform }) => {
  await thread.post(welcomeMessage(platform));
});
