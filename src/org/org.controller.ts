import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { OrgService } from './org.service';
import {
  AddMemberDto,
  OrgMemberResponseDto,
  OrgResponseDto,
  UpdateMemberRoleDto,
  UpdateOrgDto,
} from './dto/org.dto';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';

@ApiTags('Organisation')
@ApiBearerAuth()
@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  private getContext(req: Request): { userId: number; orgId: number; role: any } {
    const user = (req as any).user;
    const orgId = (req as any).orgId;
    const role = (req as any).role;
    if (!user || !orgId || !role) throw new UnauthorizedException();
    return { userId: user.id, orgId, role };
  }

  @Get()
  @ApiOperation({ summary: 'Get current organisation' })
  @ApiWrappedOkResponse({ dataDto: OrgResponseDto, description: 'Organisation details' })
  getOrg(@Req() req: Request): Promise<OrgResponseDto> {
    const { orgId } = this.getContext(req);
    return this.orgService.getOrg(orgId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update organisation name (owner/admin)' })
  @ApiWrappedOkResponse({ dataDto: OrgResponseDto, description: 'Updated organisation' })
  updateOrg(@Req() req: Request, @Body() dto: UpdateOrgDto): Promise<OrgResponseDto> {
    const { orgId, role } = this.getContext(req);
    return this.orgService.updateOrg(orgId, role, dto);
  }

  @Get('members')
  @ApiOperation({ summary: 'List all organisation members' })
  @ApiWrappedOkResponse({ dataDto: OrgMemberResponseDto, isArray: true, description: 'Member list' })
  getMembers(@Req() req: Request): Promise<OrgMemberResponseDto[]> {
    const { orgId } = this.getContext(req);
    return this.orgService.getMembers(orgId);
  }

  @Post('members')
  @ApiOperation({ summary: 'Add a member by email (owner/admin)' })
  @ApiWrappedOkResponse({ dataDto: OrgMemberResponseDto, description: 'Added member' })
  addMember(@Req() req: Request, @Body() dto: AddMemberDto): Promise<OrgMemberResponseDto> {
    const { orgId, role } = this.getContext(req);
    return this.orgService.addMember(orgId, role, dto);
  }

  @Patch('members/:userId/role')
  @ApiOperation({ summary: 'Change a member role (owner only)' })
  @ApiWrappedOkResponse({ dataDto: OrgMemberResponseDto, description: 'Updated member' })
  updateRole(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<OrgMemberResponseDto> {
    const { orgId, role } = this.getContext(req);
    return this.orgService.updateMemberRole(orgId, role, userId, dto);
  }

  @Delete('members/:userId')
  @ApiOperation({ summary: 'Remove a member (owner/admin)' })
  async removeMember(
    @Req() req: Request,
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<void> {
    const { userId: actorId, orgId, role } = this.getContext(req);
    return this.orgService.removeMember(orgId, role, actorId, userId);
  }
}
