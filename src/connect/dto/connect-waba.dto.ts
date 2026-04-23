import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmpty,
  IsNotEmpty,
  IsNotEmptyObject,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ConnectWhatsAppRequestDataDTO {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'WhatsApp Connect Phone Number ID' })
  phoneNumberId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'WhatsApp Connect WABA ID' })
  wabaId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'WhatsApp Connect Business ID' })
  businessId: string;
}

export class ConnectWhatsAppRequestDTO {
  @ApiProperty({ description: 'WhatsApp Connect Request Data' })
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ConnectWhatsAppRequestDataDTO)
  data: ConnectWhatsAppRequestDataDTO;

  @ApiProperty({ description: 'WhatsApp Connect Code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ConnectWhatsAppResponseDTO {
  @ApiProperty({ description: 'WhatsApp Connect Access Token' })
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}
