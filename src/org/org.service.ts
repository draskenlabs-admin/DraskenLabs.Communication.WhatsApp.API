import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AddMemberDto,
  CreateOrgDto,
  MyOrgResponseDto,
  OrgMemberResponseDto,
  OrgResponseDto,
  UpdateMemberRoleDto,
  UpdateOrgDto,
} from './dto/org.dto';

@Injectable()
export class OrgService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrgForUser(dto: CreateOrgDto, userId: number): Promise<{ orgId: number; role: OrgRole }> {
    return this.createOrg(dto.name, userId);
  }

  async getUserOrgs(userId: number): Promise<MyOrgResponseDto[]> {
    const memberships = await this.prisma.orgMember.findMany({
      where: { userId },
      include: { org: true },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.org.id,
      name: m.org.name,
      slug: m.org.slug,
      role: m.role,
      createdAt: m.org.createdAt,
    }));
  }

  async switchOrg(userId: number, targetOrgId: number): Promise<{ orgId: number; role: OrgRole }> {
    const member = await this.prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId: targetOrgId, userId } },
    });

    if (!member) throw new NotFoundException('You are not a member of this organisation');

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeOrgId: targetOrgId },
    });

    return { orgId: targetOrgId, role: member.role };
  }

  async createOrg(name: string, ownerUserId: number): Promise<{ orgId: number; role: OrgRole }> {
    const slug = await this.generateSlug(name);

    const org = await this.prisma.organisation.create({
      data: {
        name,
        slug,
        members: {
          create: { userId: ownerUserId, role: OrgRole.owner },
        },
      },
    });

    await this.prisma.user.update({
      where: { id: ownerUserId },
      data: { activeOrgId: org.id },
    });

    return { orgId: org.id, role: OrgRole.owner };
  }

  async getOrg(orgId: number): Promise<OrgResponseDto> {
    const org = await this.prisma.organisation.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organisation not found');
    return { id: org.id, name: org.name, slug: org.slug, createdAt: org.createdAt };
  }

  async updateOrg(orgId: number, role: OrgRole, dto: UpdateOrgDto): Promise<OrgResponseDto> {
    this.assertAdminOrOwner(role);
    const slug = await this.generateSlug(dto.name, orgId);
    const org = await this.prisma.organisation.update({
      where: { id: orgId },
      data: { name: dto.name, slug },
    });
    return { id: org.id, name: org.name, slug: org.slug, createdAt: org.createdAt };
  }

  async getMembers(orgId: number): Promise<OrgMemberResponseDto[]> {
    const members = await this.prisma.orgMember.findMany({
      where: { orgId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      role: m.role,
      joinedAt: m.createdAt,
    }));
  }

  async addMember(orgId: number, actorRole: OrgRole, dto: AddMemberDto): Promise<OrgMemberResponseDto> {
    this.assertAdminOrOwner(actorRole);

    const target = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!target) throw new NotFoundException('User not found — they must sign up first');

    const existing = await this.prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: target.id } },
    });
    if (existing) throw new BadRequestException('User is already a member of this organisation');

    const role = dto.role ?? OrgRole.member;
    const member = await this.prisma.orgMember.create({
      data: { orgId, userId: target.id, role },
      include: { user: true },
    });

    return {
      userId: member.userId,
      email: member.user.email,
      firstName: member.user.firstName,
      lastName: member.user.lastName,
      role: member.role,
      joinedAt: member.createdAt,
    };
  }

  async updateMemberRole(
    orgId: number,
    actorRole: OrgRole,
    targetUserId: number,
    dto: UpdateMemberRoleDto,
  ): Promise<OrgMemberResponseDto> {
    if (actorRole !== OrgRole.owner) throw new ForbiddenException('Only the owner can change roles');

    const member = await this.prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: targetUserId } },
      include: { user: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === OrgRole.owner) throw new ForbiddenException('Cannot change the owner role');

    const updated = await this.prisma.orgMember.update({
      where: { orgId_userId: { orgId, userId: targetUserId } },
      data: { role: dto.role },
      include: { user: true },
    });

    return {
      userId: updated.userId,
      email: updated.user.email,
      firstName: updated.user.firstName,
      lastName: updated.user.lastName,
      role: updated.role,
      joinedAt: updated.createdAt,
    };
  }

  async removeMember(orgId: number, actorRole: OrgRole, actorUserId: number, targetUserId: number): Promise<void> {
    this.assertAdminOrOwner(actorRole);

    const member = await this.prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId: targetUserId } },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (member.role === OrgRole.owner) throw new ForbiddenException('Cannot remove the owner');
    if (actorRole === OrgRole.admin && member.role === OrgRole.admin) {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    await this.prisma.orgMember.delete({
      where: { orgId_userId: { orgId, userId: targetUserId } },
    });
  }

  async getMemberRole(orgId: number, userId: number): Promise<OrgRole | null> {
    const member = await this.prisma.orgMember.findUnique({
      where: { orgId_userId: { orgId, userId } },
    });
    return member?.role ?? null;
  }

  private assertAdminOrOwner(role: OrgRole): void {
    if (role !== OrgRole.owner && role !== OrgRole.admin) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async generateSlug(name: string, excludeOrgId?: number): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base;
    let attempt = 0;

    while (true) {
      const existing = await this.prisma.organisation.findUnique({ where: { slug } });
      if (!existing || existing.id === excludeOrgId) return slug;
      attempt++;
      slug = `${base}-${attempt}`;
    }
  }
}
