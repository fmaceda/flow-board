import { ApiProperty } from '@nestjs/swagger';
import { WorkspaceRole } from '../../generated/prisma/client';
import { UserResponseDto } from '../../user/dto/user-response.dto';

export class WorkspaceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ required: false, nullable: true })
  description!: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class WorkspaceMemberResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: WorkspaceRole })
  role!: WorkspaceRole;

  @ApiProperty()
  joinedAt!: Date;

  @ApiProperty()
  user!: UserResponseDto;
}
