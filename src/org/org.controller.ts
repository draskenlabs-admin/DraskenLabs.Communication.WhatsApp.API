import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiOperation, ApiParam, ApiHeader } from '@nestjs/swagger';
import { Request } from 'express';
import { OrgService } from './org.service';
import { ApiWrappedOkResponse, ApiStandardErrorResponses } from 'src/common/responses/swagger.decorators';
import {
  OrganisationDto,
  MemberDto,
  InvitationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  UpdateOrganisationDto,
} from './dto/org.dto';

@ApiTags('Organisations')
@ApiSecurity('sso-token')
@ApiHeader({ name: 'Authorization', description: 'SSO Bearer token — Bearer <sso_access_token>', required: true })
@ApiStandardErrorResponses({ unauthorized: true, forbidden: true })
@Controller('organisation')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  private auth(req: Request): string {
    const authorization = req.headers.authorization;
    if (!authorization) throw new UnauthorizedException('Missing Authorization header');
    return authorization;
  }

  @Get()
  @ApiOperation({ summary: 'List organisations for the authenticated SSO user' })
  @ApiWrappedOkResponse({ dataDto: OrganisationDto, isArray: true, description: 'List of organisations' })
  listOrgs(@Req() req: Request) {
    return this.orgService.listOrgs(this.auth(req));
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Get organisation details' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: OrganisationDto, description: 'Organisation details' })
  @ApiStandardErrorResponses({ notFound: true })
  getOrg(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.orgService.getOrg(orgId, this.auth(req));
  }

  @Patch(':orgId')
  @ApiOperation({ summary: 'Update organisation name or slug (admin only)' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: OrganisationDto, description: 'Updated organisation' })
  updateOrg(@Param('orgId') orgId: string, @Req() req: Request, @Body() body: UpdateOrganisationDto) {
    return this.orgService.updateOrg(orgId, this.auth(req), body as unknown as Record<string, unknown>);
  }

  @Get(':orgId/members')
  @ApiOperation({ summary: 'List members of an organisation' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: MemberDto, isArray: true, description: 'Organisation member list' })
  listMembers(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.orgService.listMembers(orgId, this.auth(req));
  }

  @Post(':orgId/members/invite')
  @ApiOperation({ summary: 'Invite a user to the organisation' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: InvitationDto, description: 'Created invitation' })
  inviteMember(@Param('orgId') orgId: string, @Req() req: Request, @Body() body: InviteMemberDto) {
    return this.orgService.inviteMember(orgId, this.auth(req), body as unknown as Record<string, unknown>);
  }

  @Patch(':orgId/members/:userId/role')
  @ApiOperation({ summary: "Update a member's role (admin only)" })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiParam({ name: 'userId', description: 'SSO user ID' })
  @ApiWrappedOkResponse({ dataDto: MemberDto, description: 'Updated member' })
  updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.orgService.updateMemberRole(orgId, userId, this.auth(req), body as unknown as Record<string, unknown>);
  }

  @Delete(':orgId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the organisation (admin only)' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiParam({ name: 'userId', description: 'SSO user ID' })
  removeMember(@Param('orgId') orgId: string, @Param('userId') userId: string, @Req() req: Request) {
    return this.orgService.removeMember(orgId, userId, this.auth(req));
  }

  @Get(':orgId/invitations')
  @ApiOperation({ summary: 'List pending invitations for an organisation' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: InvitationDto, isArray: true, description: 'Pending invitations' })
  listInvitations(@Param('orgId') orgId: string, @Req() req: Request) {
    return this.orgService.listInvitations(orgId, this.auth(req));
  }
}
