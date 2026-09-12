import {
  Actions,
  Button,
  Context,
  Header,
  Markdown,
  Message,
  Section,
  defineChannelComponent,
  defineChannelTool,
} from "@copilotkit/channels";
import {
  intentOutputSchema,
  validateIntentOutput,
  type IntentInput,
} from "agent-core/interlock-intent";
import { z } from "zod";
import { isAllowedSlackActor } from "./interlock";

export function interlockApproval(config: {
  allowedWorkspaceId: string;
  coordinatorUrl: string;
  token: string;
}) {
  return defineChannelComponent({
    name: "interlock_approval",
    description:
      "Render approval for an already-persisted Interlock proposal. Never invent an ID or revision.",
    parameters: z.object({
      workflowId: z.string(),
      revision: z.number().int().positive(),
      resourceId: z.string(),
      candidateRevision: z.string(),
      cardToken: z.string(),
      condition: z.string(),
    }),
    render(props) {
      return (
        <Message accent="#355B9A">
          <Header>Interlock approval · revision {props.revision}</Header>
          <Section>
            <Markdown>{`**Hold ${props.candidateRevision}** on ${props.resourceId}\n\n${props.condition}`}</Markdown>
          </Section>
          <Context>Only the trusted configured owner can activate this exact revision.</Context>
          <Actions>
            <Button
              value={{ workflowId: props.workflowId, revision: props.revision }}
              style="primary"
              onClick={async (ctx) => {
                if (
                  !isAllowedSlackActor(
                    ctx.user?.id,
                    ctx.actor,
                    config.allowedWorkspaceId,
                  )
                ) {
                  await ctx.thread.postEphemeral(
                    ctx.actor,
                    "Approval rejected because the Slack workspace identity did not match.",
                    { fallbackToDM: false },
                  );
                  return;
                }
                const response = await fetch(
                  `${config.coordinatorUrl}/v1/slack/approve`,
                  {
                    method: "POST",
                    headers: {
                      authorization: `Bearer ${config.token}`,
                      "content-type": "application/json",
                    },
                    body: JSON.stringify({
                      workflowId: props.workflowId,
                      revision: props.revision,
                      resourceId: props.resourceId,
                      candidateRevision: props.candidateRevision,
                      cardToken: props.cardToken,
                      workspaceId: config.allowedWorkspaceId,
                      actorId: ctx.actor.id,
                    }),
                    signal: AbortSignal.timeout(2_000),
                  },
                );
                if (!response.ok) {
                  await ctx.thread.postEphemeral(
                    ctx.actor,
                    "Approval rejected. Only the configured owner and exact current revision are accepted.",
                    { fallbackToDM: false },
                  );
                  return;
                }
                await ctx.thread.update(
                  ctx.message.ref,
                  `Approved Interlock revision ${props.revision}: hold ${props.candidateRevision} is active.`,
                );
              }}
            >
              Approve exact revision
            </Button>
          </Actions>
        </Message>
      );
    },
  });
}

/**
 * The tool-handler `Thread` contract is narrower than the Channels runtime
 * object it actually receives, so the durable post is reached through an
 * explicit capability check rather than an unchecked cast.
 */
type DurableThread = {
  postRegisteredComponent(
    componentName: string,
    props: Record<string, unknown>,
    renderContext: { platform: "slack"; signal: AbortSignal },
  ): Promise<unknown>;
};

function durable(thread: unknown): DurableThread {
  const candidate = thread as Partial<DurableThread>;
  if (typeof candidate.postRegisteredComponent !== "function") {
    // Refusing beats posting a button that looks live and is inert after a
    // restart: an approval nobody can action is worse than a visible failure.
    throw new Error(
      "This Channels runtime cannot post a registered component, so an approval could not survive a listener restart.",
    );
  }
  return candidate as DurableThread;
}

export function interlockProposal(config: {
  allowedWorkspaceId: string;
  allowedChannelId: string;
  resourceId: string;
  candidateRevision: string;
  coordinatorUrl: string;
  token: string;
  request?: typeof fetch;
}) {
  return defineChannelTool({
    name: "resolve_interlock_intent",
    description:
      "Return the bounded Intent decision exactly once. Abstention is valid and never creates authority.",
    parameters: intentOutputSchema,
    async handler(
      raw,
      { thread, signal, platform },
    ) {
      if (platform !== "slack") return "Interlock proposals require Slack.";
      const state = await thread.state<{
        interlockThreadRef?: string;
        interlockIntent?: IntentInput;
        interlockIntentResolved?: boolean;
      }>();
      if (!state?.interlockThreadRef || !state.interlockIntent) {
        return "No bounded attributed Slack context is available; abstain.";
      }
      if (state.interlockIntentResolved) return "This attributed Intent is already resolved.";
      const output = validateIntentOutput(raw, state.interlockIntent);
      if (output.kind === "abstain") {
        await thread.setState({ ...state, interlockIntentResolved: true });
        return `Safely abstained: ${output.reason}.`;
      }
      const selected = new Set(output.sourceDeliveryIds);
      const boundedContext = state.interlockIntent.messages.filter(({ deliveryId }) =>
        selected.has(deliveryId)
      );
      const response = await (config.request ?? fetch)(
        `${config.coordinatorUrl}/v1/slack/proposals`,
        {
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
            threadRef: state.interlockThreadRef,
            threshold: output.threshold,
            windowMs: output.windowMs,
            sourceDeliveryIds: output.sourceDeliveryIds,
            boundedContext,
          }),
          signal: AbortSignal.timeout(2_000),
        },
      );
      if (!response.ok) {
        return "The coordinator rejected this proposal; abstain without a workaround.";
      }
      const props = z.object({
        workflowId: z.string(),
        revision: z.number().int().positive(),
        resourceId: z.string(),
        candidateRevision: z.string(),
        cardToken: z.string(),
        condition: z.string(),
      }).parse(await response.json());
      // Post by registered name, never as pre-rendered IR. The snapshot keeps
      // the component name and these exact props, so a listener restart
      // re-renders the card and rebuilds its click handler. Pre-rendered IR
      // persists only a path into a tree the restarted process no longer has,
      // which leaves an approval button that looks live and does nothing.
      // ponytail: `postRegisteredComponent` is marked internal in
      // channels-core 0.9.2. It is the only durable path today; move to the
      // public equivalent when one ships.
      await durable(thread).postRegisteredComponent("interlock_approval", props, {
        platform: "slack",
        signal: signal ?? new AbortController().signal,
      });
      await thread.setState({ ...state, interlockIntentResolved: true });
      return "Persisted and displayed the exact Interlock proposal. Stop without restating it.";
    },
  });
}
