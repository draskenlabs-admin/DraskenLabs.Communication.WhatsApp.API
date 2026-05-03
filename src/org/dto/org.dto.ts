import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class OrganisationDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() slug: string;
  @ApiPropertyOptional() imageUrl?: string;
  @ApiProperty() membersCount: number;
  @ApiProperty() createdAt: string;
}

export class MemberDto {
  @ApiProperty() userId: string;
  @ApiProperty() email: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() role: string;
  @ApiProperty() joinedAt: string;
}

export class InvitationDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() role: string;
  @ApiProperty() createdAt: string;
}

export class InviteMemberDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @IsNotEmpty() role: string;
}

export class UpdateMemberRoleDto {
  @ApiProperty() @IsString() @IsNotEmpty() role: string;
}

export class UpdateOrganisationDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;
}
