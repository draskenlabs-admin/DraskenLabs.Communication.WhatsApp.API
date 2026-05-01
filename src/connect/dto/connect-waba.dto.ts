import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectWhatsAppRequestDTO {
  @ApiProperty({ description: 'OAuth code received from Meta Embedded Signup' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID' })
  @IsString()
  @IsNotEmpty()
  wabaId: string;

  @ApiProperty({ description: 'Meta Business ID' })
  @IsString()
  @IsNotEmpty()
  businessId: string;
}

export class ConnectedPhoneNumberDTO {
  @ApiProperty() phoneNumberId: string;
  @ApiProperty() displayPhoneNumber: string;
  @ApiProperty() verifiedName: string;
}

export class ConnectWhatsAppResponseDTO {
  @ApiProperty() wabaId: string;
  @ApiProperty() businessId: string;

  @ApiProperty({ type: ConnectedPhoneNumberDTO, isArray: true })
  phoneNumbers: ConnectedPhoneNumberDTO[];
}
