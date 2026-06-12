import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { WorkspaceRole } from '../../generated/prisma/client';
import { IsEnum } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: WorkspaceRole, default: WorkspaceRole.MEMBER })
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole = WorkspaceRole.MEMBER;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: WorkspaceRole })
  @IsEnum(WorkspaceRole)
  role!: WorkspaceRole;
}
