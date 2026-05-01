import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Optional label for this API key' })
  @IsString()
  @IsNotEmpty()
  label: string;
}

export class ApiKeyResponseDto {
  @ApiProperty()
  accessKey: string;

  @ApiProperty()
  secretKey: string;
}

export class ApiKeyListResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  accessKey: string;

  @ApiProperty()
  status: boolean;

  @ApiProperty()
  createdAt: Date;
}
