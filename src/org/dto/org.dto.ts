import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
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
