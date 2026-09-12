import {
  Actions,
  Button,
  Context,
  Header,
  Markdown,
  Message,
  Section,
  defineChannelComponent,
} from "@copilotkit/channels";
import { z } from "zod";

export function interlockApproval(config: {
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
