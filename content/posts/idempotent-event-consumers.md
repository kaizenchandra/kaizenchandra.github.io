A consumer can successfully process a message and fail before acknowledging it. When the broker delivers the message again, the handler must recognize that its business effect has already been applied.

## Choose a key that identifies the effect

Use a stable identifier supplied by the producer or derived from the business operation. Scope it by consumer or tenant when the same identifier can legitimately appear in multiple contexts. Store the key for at least as long as the supported replay window.

## Commit the key and the effect together

When both writes use the same database, commit the deduplication record and business state in one transaction. A unique constraint on the scoped event key makes concurrent attempts race safely. Inserting a deduplication record separately can leave an event marked complete after its business write fails.

```sql
BEGIN;

WITH accepted AS (
  INSERT INTO processed_events (consumer_id, event_id)
  VALUES (:consumer_id, :event_id)
  ON CONFLICT (consumer_id, event_id) DO NOTHING
  RETURNING event_id
)
INSERT INTO account_entries (event_id, amount)
SELECT event_id, :amount FROM accepted;

COMMIT;
```

Acknowledge the event after the transaction commits. If an external system owns the effect, use an idempotency key that the system honors, or record an outbox entry in the same local transaction and design the downstream delivery for replay.

## Test the failure boundary

Deliver the same event twice and verify that one business effect persists. Repeat with concurrent consumers, then simulate a crash after commit and before acknowledgment. Confirm that the duplicate can be acknowledged without repeating the effect.

[Run a small in-memory demonstration](../../lab/#idempotency). The lab shows the core behavior. A production system needs durable state and atomicity.
