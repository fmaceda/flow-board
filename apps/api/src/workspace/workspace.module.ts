import { Module } from '@nestjs/common';
import { WorkspacePermissionsService } from './workspace-permissions.service';
import { WorkspaceMemberGuard } from './guards/workspace-member.guard';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';

@Module({
  controllers: [WorkspaceController],
  providers: [
    WorkspacePermissionsService,
    WorkspaceMemberGuard,
    WorkspaceService,
  ],
  exports: [WorkspacePermissionsService, WorkspaceMemberGuard],
})
export class WorkspaceModule {}
