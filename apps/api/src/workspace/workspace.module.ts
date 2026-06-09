import { Module } from '@nestjs/common';
import { WorkspacePermissionsService } from './workspace-permissions.service';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';

@Module({
  providers: [WorkspacePermissionsService, WorkspaceMemberGuard],
  exports: [WorkspacePermissionsService, WorkspaceMemberGuard],
})
export class WorkspaceModule {}
