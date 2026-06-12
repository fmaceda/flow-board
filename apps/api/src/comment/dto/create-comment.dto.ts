import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Looks good, approved!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content!: string;
}
