import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateCategory, TemplateStatus } from '@prisma/client';

export class TemplateResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  metaTemplateId: string;

  @ApiProperty()
  wabaId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  language: string;

  @ApiProperty({ enum: TemplateCategory })
  category: TemplateCategory;

  @ApiProperty({ enum: TemplateStatus })
  status: TemplateStatus;

  @ApiProperty({ description: 'Template components array from Meta' })
  components: any;

  @ApiPropertyOptional()
  rejectedReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TemplateSyncResponseDto {
  @ApiProperty()
  synced: number;

  @ApiProperty()
  wabaId: string;
}
