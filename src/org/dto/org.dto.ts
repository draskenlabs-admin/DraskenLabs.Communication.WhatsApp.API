import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { OrgRole } from '@prisma/client';

export class OrgResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  createdAt: Date;
}

export class OrgMemberResponseDto {
  @ApiProperty()
  userId: number;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ enum: OrgRole })
  role: OrgRole;

  @ApiProperty()
  joinedAt: Date;
}

export class UpdateOrgDto {
  @ApiProperty({ description: 'New organisation name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class AddMemberDto {
  @ApiProperty({ description: 'Email of existing platform user to add' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ enum: OrgRole, default: OrgRole.member })
  @IsEnum(OrgRole)
  role?: OrgRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: [OrgRole.admin, OrgRole.member] })
  @IsEnum([OrgRole.admin, OrgRole.member])
  role: OrgRole;
}

export class CreateOrgDto {
  @ApiProperty({ description: 'Organisation name' })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class SwitchOrgDto {
  @ApiProperty({ description: 'ID of the organisation to switch to' })
  @IsInt()
  orgId: number;
}

export class MyOrgResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ enum: OrgRole })
  role: OrgRole;

  @ApiProperty()
  createdAt: Date;
}

export class SwitchOrgResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty()
  orgId: number;

  @ApiProperty({ enum: OrgRole })
  role: OrgRole;
}
