# Decision 0.2: Database Schema Design

Design this before writing any code. The schema is the foundation; a bad schema is expensive to change later.

**Core entities and relationships:**

```
User
  ├── belongs to many Workspaces (via WorkspaceMember, with role)
  ├── owns many Tasks (assigned_to)
  └── authors many Comments

Workspace
  ├── has many WorkspaceMembers (User join table with role enum)
  └── has many Projects

Project
  ├── belongs to Workspace
  └── has many Tasks

Task
  ├── belongs to Project
  ├── has one assigned User (nullable)
  ├── has many Comments
  ├── has many Attachments
  └── has many Labels (via TaskLabel join table)

Comment
  ├── belongs to Task
  └── belongs to User (author)

Attachment
  ├── belongs to Task
  └── has a storage key (S3/MinIO key, not the full URL)
```

**Key design questions to answer before you write a migration:**

- **UUIDs vs integer IDs?** UUIDs (v4 or v7) prevent ID enumeration attacks and are better for distributed systems. The trade-off is larger index size and slightly slower joins. For this project: use UUIDs. It's the production default.
- **Soft deletes?** If you delete a task, should it really be gone? A `deleted_at` timestamp lets you recover data and preserve audit trails. The trade-off is more complex queries (always filter `WHERE deleted_at IS NULL`). Decision: soft delete Tasks and Projects; hard delete Attachments (also delete from storage).
- **Timestamps on everything?** Yes. `created_at` and `updated_at` on every table. Prisma can handle this automatically. Non-negotiable for debugging production issues.
- **How do you model workspace roles?** A `WorkspaceMember` join table with a `role` column (enum: `OWNER | ADMIN | MEMBER`). Never a boolean `is_admin`. Roles will grow; start with an enum.