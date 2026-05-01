import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageResponseDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  metaMessageId?: string;

  @ApiProperty()
  phoneNumberId: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;
}

export class MessageListItemDto {
  @ApiProperty()
  id: number;

  @ApiPropertyOptional()
  metaMessageId?: string;

  @ApiProperty()
  phoneNumberId: string;

  @ApiProperty()
  to: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
