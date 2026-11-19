## Problem and requirements

CNA Insurance needed to post-process generated documents and pass them to downstream consumers. Storage, messaging, and
delivery systems could fail independently, so each stage needed a clear failure-handling path.

## Components and integration

I led delivery of an event-driven platform that integrated SmartCOMM, Cloud Storage, Cloud Pub/Sub, and SFTP. I designed
failure handling across asynchronous messaging, storage, and downstream integrations and guided the work through
technical and code reviews.

## Delivery outcome

The platform supported asynchronous document processing and downstream delivery, with failure handling across
integration boundaries.

## Related demonstration

[Try retry and backoff in the lab](../../lab/#backoff). The example illustrates a general design pattern.

## Reliability trade-off

**Process documents asynchronously.** Storage, messaging, and delivery can fail independently. The design lets
downstream delivery run separately from the generation workflow. Each integration then needs a recovery path and a way
to track document completion. The documented outcome is support for asynchronous processing and downstream delivery.
