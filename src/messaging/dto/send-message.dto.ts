import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export enum MessageTypeEnum {
  text = 'text',
  image = 'image',
  video = 'video',
  audio = 'audio',
  document = 'document',
  template = 'template',
  interactive = 'interactive',
  location = 'location',
  reaction = 'reaction',
  contacts = 'contacts',
}

export class SendMessageDto {
  @ApiProperty({ description: 'Phone number ID to send from (from your connected WABA)' })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string;

  @ApiProperty({ description: 'Recipient phone number in E.164 format (e.g. 447911123456)' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ enum: MessageTypeEnum, description: 'Message type' })
  @IsEnum(MessageTypeEnum)
  type: MessageTypeEnum;

  @ApiPropertyOptional({ description: 'Message body text (required for type=text)' })
  @ValidateIf((o) => o.type === MessageTypeEnum.text)
  @IsString()
  @IsNotEmpty()
  text?: string;

  @ApiPropertyOptional({ description: 'Media URL (required for image/video/audio/document)' })
  @ValidateIf((o) => ['image', 'video', 'audio', 'document'].includes(o.type))
  @IsString()
  @IsNotEmpty()
  mediaUrl?: string;

  @ApiPropertyOptional({ description: 'Media caption (optional for image/video/document)' })
  @IsOptional()
  @IsString()
  caption?: string;
}
