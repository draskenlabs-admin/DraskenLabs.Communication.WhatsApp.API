import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DebugTokenRequestDTO {
  @ApiProperty({ description: 'Access Token' })
  @IsNotEmpty()
  @IsString()
  accessToken: string;
}
