import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { TaskModule } from '../task/task.module';
import { WorkspaceModule } from '../workspace/workspace.module';

@Module({
  imports: [TaskModule, WorkspaceModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
