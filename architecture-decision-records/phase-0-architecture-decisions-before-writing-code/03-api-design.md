# Decision 0.3: API Design

Use REST. Not because GraphQL is bad — it's a legitimate tool for certain use cases — but because REST fundamentals are more universal and you'll encounter it more in interviews and production systems.

**REST constraints to internalize:**

- Resources are nouns, not verbs: `GET /workspaces/:id/tasks` not `GET /getTasksForWorkspace`
- HTTP methods map to actions: GET=read, POST=create, PUT/PATCH=update, DELETE=delete
- PATCH for partial updates, PUT for full replacement (you'll use PATCH almost always)
- Response status codes must be meaningful: 201 for creation, 204 for empty success, 404 when a resource isn't found, 403 when found but not authorized (not 404 — that leaks existence information... but think about when leaking existence is actually a problem)

**URL structure for FlowBoard:**

```
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout

GET    /workspaces
POST   /workspaces
GET    /workspaces/:workspaceId
PATCH  /workspaces/:workspaceId
DELETE /workspaces/:workspaceId

GET    /workspaces/:workspaceId/members
POST   /workspaces/:workspaceId/members        (invite)
DELETE /workspaces/:workspaceId/members/:userId

GET    /workspaces/:workspaceId/projects
POST   /workspaces/:workspaceId/projects
GET    /workspaces/:workspaceId/projects/:projectId
PATCH  /workspaces/:workspaceId/projects/:projectId
DELETE /workspaces/:workspaceId/projects/:projectId

GET    /projects/:projectId/tasks
POST   /projects/:projectId/tasks
GET    /projects/:projectId/tasks/:taskId
PATCH  /projects/:projectId/tasks/:taskId
DELETE /projects/:projectId/tasks/:taskId
```

**Pagination:** Use cursor-based pagination for task lists. The pattern: `GET /projects/:id/tasks?limit=20&cursor=<encoded_task_id>`. It's more complex than offset but performs consistently on large datasets. Offset pagination requires scanning all previous rows on each request — a query for page 500 is dramatically slower than page 1.

**Filtering and sorting:** Accept these as query params: `?status=in_progress&assignee=userId&sort=created_at&dir=desc`. Keep it simple; avoid OData or other query DSLs.