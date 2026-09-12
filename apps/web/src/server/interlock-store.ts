import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  markDispatchUncertain,
  resetObservation,
  type SourceMessage,
  type Workflow,
} from "agent-core/interlock";

export class InterlockStore {
  readonly database: DatabaseSync;
  readonly lockPath: string;
  private lockDatabase: DatabaseSync;

  constructor(readonly path: string) {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
    this.lockPath = `${path}.lock`;
    this.lockDatabase = this.acquireLock();
    this.database = new DatabaseSync(path);
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA busy_timeout = 5000;
      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        state TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS deliveries (
        id TEXT PRIMARY KEY,
        received_at INTEGER NOT NULL
      ) STRICT;
      CREATE TABLE IF NOT EXISTS samples (
        workflow_id TEXT NOT NULL,
        observed_at INTEGER NOT NULL,
        value REAL NOT NULL,
        PRIMARY KEY (workflow_id, observed_at)
      ) STRICT;
      CREATE TABLE IF NOT EXISTS source_messages (
        logical_id TEXT PRIMARY KEY,
        revision_id TEXT NOT NULL UNIQUE,
        delivery_id TEXT NOT NULL UNIQUE,
        workspace_id TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        thread_ref TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        text TEXT NOT NULL,
        updated INTEGER NOT NULL,
        received_at INTEGER NOT NULL
      ) STRICT;
    `);
    const sourceColumns = this.database
      .prepare("PRAGMA table_info(source_messages)")
      .all() as { name: string }[];
    if (!sourceColumns.some(({ name }) => name === "workspace_id")) {
      this.database.exec(
        "ALTER TABLE source_messages ADD COLUMN workspace_id TEXT NOT NULL DEFAULT ''",
      );
    }
    this.recover(Date.now());
  }

  private acquireLock() {
    const lock = new DatabaseSync(this.lockPath);
    try {
      lock.exec("PRAGMA busy_timeout = 0; BEGIN EXCLUSIVE;");
      return lock;
    } catch {
      lock.close();
      throw new Error("Interlock database is already owned by another process.");
    }
  }

  private recover(now: number) {
    for (const workflow of this.list()) {
      const recovered =
        workflow.status === "DISPATCHING"
          ? markDispatchUncertain(workflow)
          : ["ACTIVE_HOLD", "OBSERVING", "READY"].includes(workflow.status)
            ? resetObservation(workflow, "restart", now)
            : workflow;
      if (recovered !== workflow) this.save(recovered, now);
    }
  }

  save(workflow: Workflow, now = Date.now()) {
    this.database
      .prepare(`
        INSERT INTO workflows (id, state, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET state = excluded.state, updated_at = excluded.updated_at
      `)
      .run(workflow.contract.id, JSON.stringify(workflow), now);
  }

  recordDelivery(deliveryId: string, now = Date.now()) {
    const result = this.database
      .prepare("INSERT OR IGNORE INTO deliveries (id, received_at) VALUES (?, ?)")
      .run(deliveryId, now);
    return result.changes === 1;
  }

  createFromDelivery(workflow: Workflow, now = Date.now()) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const result = this.database
        .prepare("INSERT OR IGNORE INTO deliveries (id, received_at) VALUES (?, ?)")
        .run(workflow.contract.sourceDeliveryId, now);
      if (result.changes === 1) this.save(workflow, now);
      this.database.exec("COMMIT");
      return result.changes === 1;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  saveObservation(
    workflow: Workflow,
    value: number,
    observedAt: number,
    now = Date.now(),
  ) {
    this.database.exec("BEGIN IMMEDIATE");
    try {
      this.database
        .prepare(`
          INSERT INTO samples (workflow_id, observed_at, value) VALUES (?, ?, ?)
          ON CONFLICT(workflow_id, observed_at) DO UPDATE SET value = excluded.value
        `)
        .run(workflow.contract.id, observedAt, value);
      this.save(workflow, now);
      this.database.exec("COMMIT");
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  samples(workflowId: string) {
    return this.database
      .prepare("SELECT observed_at AS observedAt, value FROM samples WHERE workflow_id = ? ORDER BY observed_at")
      .all(workflowId) as { observedAt: number; value: number }[];
  }

  ingestSource(message: SourceMessage, now = Date.now()) {
    if (Buffer.byteLength(message.text) > 4_000) {
      throw new Error("Source message exceeds retention limit.");
    }
    const result = this.database
      .prepare(`
        INSERT INTO source_messages (
          logical_id, revision_id, delivery_id, workspace_id, channel_id,
          thread_ref, actor_id, text, updated, received_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(logical_id) DO UPDATE SET
          revision_id = excluded.revision_id,
          delivery_id = excluded.delivery_id,
          workspace_id = excluded.workspace_id,
          actor_id = excluded.actor_id,
          text = excluded.text,
          updated = excluded.updated,
          received_at = excluded.received_at
        WHERE excluded.updated = 1 AND excluded.revision_id != source_messages.revision_id
      `)
      .run(
        message.logicalMessageId,
        message.revisionId,
        message.deliveryId,
        message.workspaceId,
        message.channelId,
        message.threadRef,
        message.actorId,
        message.text,
        message.updated ? 1 : 0,
        now,
      );
    return result.changes === 1;
  }

  sourceContext(threadRef: string, limit = 12): SourceMessage[] {
    return (
      this.database
        .prepare(`
          SELECT delivery_id AS deliveryId, logical_id AS logicalMessageId,
            revision_id AS revisionId, workspace_id AS workspaceId,
            channel_id AS channelId,
            thread_ref AS threadRef, actor_id AS actorId, text,
            updated
          FROM source_messages
          WHERE thread_ref = ?
          ORDER BY received_at DESC
          LIMIT ?
        `)
        .all(threadRef, Math.min(Math.max(limit, 1), 12)) as
        (Omit<SourceMessage, "updated"> & { updated: number })[]
    ).reverse().map((message) => ({ ...message, updated: message.updated === 1 }));
  }

  get(id: string): Workflow | null {
    const row = this.database
      .prepare("SELECT state FROM workflows WHERE id = ?")
      .get(id) as { state: string } | undefined;
    return row ? (JSON.parse(row.state) as Workflow) : null;
  }

  list(): Workflow[] {
    return (
      this.database
        .prepare("SELECT state FROM workflows ORDER BY updated_at DESC")
        .all() as { state: string }[]
    ).map(({ state }) => JSON.parse(state) as Workflow);
  }

  close() {
    this.database.close();
    this.lockDatabase.exec("ROLLBACK");
    this.lockDatabase.close();
  }
}
