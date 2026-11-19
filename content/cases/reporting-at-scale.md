## Problem

Report generation over millions of records could exceed synchronous request timeouts.

## Architecture and components

I designed and built an asynchronous reporting platform using Java, Spring Boot, and JasperReports for Stafftravel
Voyage.

## Processing outcome

The platform processed millions of records and reduced timeout-related failures by **25%**.

## Asynchronous processing trade-off

**Move report generation off the synchronous request path.** Long-running report generation exceeded synchronous
timeouts. Asynchronous processing gives generation a separate execution window and introduces completion and
failure-handling responsibilities.

## Attribution

The portfolio gallery identifies Apple Political. This case study identifies Stafftravel Voyage. The Cyber
Infrastructure experience entry lists both engagements.
