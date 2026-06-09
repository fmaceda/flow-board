# Decision 0.1: Monolith vs. Microservices

**Choose a modular monolith.** Here's why:

Microservices introduce distributed systems complexity (network latency, partial failures, distributed transactions, service discovery, separate deployment pipelines) that will mask what you're actually trying to learn. The risk is spending 80% of your time on infrastructure and 20% on business logic.

A modular monolith means: one NestJS application, cleanly separated into modules (AuthModule, WorkspaceModule, ProjectModule, TaskModule, NotificationModule), each with its own controllers, services, and repositories. The module boundary is the future microservice boundary. If you later need to extract `NotificationModule` into its own service, the interface is already clean.

**Trade-off table:**

| Aspect | Monolith | Microservices |
|---|---|---|
| Initial complexity | Low | High |
| Deployment | Single artifact | Multiple services + orchestration |
| Local debugging | Easy | Requires service mesh or `docker-compose` orchestration |
| Independent scaling | No (scale the whole thing) | Yes (scale only what needs it) |
| Team size fit | 1-5 engineers | 10+ engineers, multiple teams |
| Data consistency | ACID transactions | Eventual consistency, sagas |

**When to split:** When a module's load profile differs drastically from the rest, or when different modules need different deployment cadences. Not before.