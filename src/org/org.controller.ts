import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
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
@ApiBearerAuth()
@ApiStandardErrorResponses({ unauthorized: true, forbidden: true })
@Controller('organisation')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  private auth(authorization: string | undefined): string {
    if (!authorization) throw new UnauthorizedException('Missing Authorization header');
    return authorization;
  }

  @Get()
  @ApiOperation({ summary: 'List organisations for the authenticated SSO user' })
  @ApiWrappedOkResponse({ dataDto: OrganisationDto, isArray: true, description: 'List of organisations' })
  listOrgs(@Headers('authorization') authorization: string) {
    return this.orgService.listOrgs(this.auth(authorization));
  }

  @Get(':orgId')
  @ApiOperation({ summary: 'Get organisation details' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: OrganisationDto, description: 'Organisation details' })
  @ApiStandardErrorResponses({ notFound: true })
  getOrg(@Param('orgId') orgId: string, @Headers('authorization') authorization: string) {
    return this.orgService.getOrg(orgId, this.auth(authorization));
  }

  @Patch(':orgId')
  @ApiOperation({ summary: 'Update organisation name or slug (admin only)' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: OrganisationDto, description: 'Updated organisation' })
  updateOrg(
    @Param('orgId') orgId: string,
    @Headers('authorization') authorization: string,
    @Body() body: UpdateOrganisationDto,
  ) {
    return this.orgService.updateOrg(orgId, this.auth(authorization), body as Record<string, unknown>);
  }

  @Get(':orgId/members')
  @ApiOperation({ summary: 'List members of an organisation' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: MemberDto, isArray: true, description: 'Organisation member list' })
  listMembers(@Param('orgId') orgId: string, @Headers('authorization') authorization: string) {
    return this.orgService.listMembers(orgId, this.auth(authorization));
  }

  @Post(':orgId/members/invite')
  @ApiOperation({ summary: 'Invite a user to the organisation' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: InvitationDto, description: 'Created invitation' })
  inviteMember(
    @Param('orgId') orgId: string,
    @Headers('authorization') authorization: string,
    @Body() body: InviteMemberDto,
  ) {
    return this.orgService.inviteMember(orgId, this.auth(authorization), body as unknown as Record<string, unknown>);
  }

  @Patch(':orgId/members/:userId/role')
  @ApiOperation({ summary: "Update a member's role (admin only)" })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiParam({ name: 'userId', description: 'SSO user ID' })
  @ApiWrappedOkResponse({ dataDto: MemberDto, description: 'Updated member' })
  updateMemberRole(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Headers('authorization') authorization: string,
    @Body() body: UpdateMemberRoleDto,
  ) {
    return this.orgService.updateMemberRole(orgId, userId, this.auth(authorization), body as unknown as Record<string, unknown>);
  }

  @Delete(':orgId/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from the organisation (admin only)' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiParam({ name: 'userId', description: 'SSO user ID' })
  removeMember(
    @Param('orgId') orgId: string,
    @Param('userId') userId: string,
    @Headers('authorization') authorization: string,
  ) {
    return this.orgService.removeMember(orgId, userId, this.auth(authorization));
  }

  @Get(':orgId/invitations')
  @ApiOperation({ summary: 'List pending invitations for an organisation' })
  @ApiParam({ name: 'orgId', description: 'SSO organisation ID' })
  @ApiWrappedOkResponse({ dataDto: InvitationDto, isArray: true, description: 'Pending invitations' })
  listInvitations(@Param('orgId') orgId: string, @Headers('authorization') authorization: string) {
    return this.orgService.listInvitations(orgId, this.auth(authorization));
  }
}
