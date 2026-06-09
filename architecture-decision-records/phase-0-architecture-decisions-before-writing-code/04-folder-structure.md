# Decision 0.4: Folder Structure

```
flow-board/
├── apps/
│   ├── api/          ← NestJS backend
│   └── web/          ← Next.js frontend
├── packages/
│   └── types/        ← Shared TypeScript types (DTOs, enums)
└── docker-compose.yml
```

Use a monorepo from the start. Tools: `npm workspaces` (simple) or `turborepo` (adds caching and pipeline orchestration). The shared `types` package is the key benefit — you define a DTO once and use it in both backend and frontend.