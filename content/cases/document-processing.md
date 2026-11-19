## Problem

CNA Insurance needed to post-process generated documents and pass them to downstream consumers. Storage, messaging, and delivery systems could fail independently, so each stage needed a clear failure-handling path.

## Solution

I led delivery of an event-driven platform that integrated SmartCOMM, Cloud Storage, Cloud Pub/Sub, and SFTP. I designed failure handling across asynchronous messaging, storage, and downstream integrations and guided the work through technical and code reviews.

## Impact

The platform supported asynchronous document processing and downstream delivery, with failure handling across integration boundaries.

## Related demonstration

[Try retry and backoff in the lab](../../lab/#backoff). The example illustrates a general design pattern.
