import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus } from '../../generated/prisma/client';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class TaskResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ required: false, nullable: true })
  description!: string | null;

  @ApiProperty({ enum: TaskStatus })
  status!: TaskStatus;

  @ApiProperty({ required: false, nullable: true })
  dueDate!: Date | null;

  @ApiProperty()
  projectId!: string;

  @ApiProperty({ required: false, nullable: true, type: () => UserResponseDto })
  assignee!: UserResponseDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TaskListResponseDto {
  @ApiProperty({ type: [TaskResponseDto] })
  data!: TaskResponseDto[];

  @ApiProperty({
    description: 'Pass as ?cursor= on the next request. null = no more pages.',
    nullable: true,
  })
  nextCursor!: string | null;
}

export class TaskQueryDto {
  @ApiPropertyOptional({ enum: TaskStatus })
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'Filter by assignee UUID' })
  assigneeId?: string;

  @ApiPropertyOptional({
    enum: ['created_at', 'due_date', 'status'],
    default: 'created_at',
  })
  sort?: 'created_at' | 'due_date' | 'status';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  dir?: 'asc' | 'desc';

  @ApiPropertyOptional({
    description: 'Cursor (last task ID from previous page)',
  })
  cursor?: string;

  @ApiPropertyOptional({ description: 'Page size (default 20, max 100)' })
  limit?: number;
}
