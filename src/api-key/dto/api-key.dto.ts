import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'The phone number ID to associate with this API key' })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @ApiProperty({ description: 'The WABA ID associated with the phone number' })
  @IsString()
  @IsNotEmpty()
  wabaId: string;
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
