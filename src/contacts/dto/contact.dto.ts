import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateContactDto {
  @ApiProperty({ description: 'Phone number in E.164 format without + (e.g. 447911123456)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{7,15}$/, { message: 'phone must be digits only, 7–15 characters (E.164 without +)' })
  phone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as key-value object' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateContactDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  optedOut?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ContactResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  phone: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiProperty()
  optedOut: boolean;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
