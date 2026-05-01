import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { OrgService } from './org.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  orgMember: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  organisation: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('OrgService', () => {
  let service: OrgService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrgService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<OrgService>(OrgService);
  });

  describe('createOrg', () => {
    it('creates org, sets owner membership, and updates activeOrgId', async () => {
      mockPrisma.organisation.findUnique.mockResolvedValue(null);
      mockPrisma.organisation.create.mockResolvedValue({ id: 1 });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.createOrg('Acme', 42);

      expect(mockPrisma.organisation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Acme',
            members: { create: { userId: 42, role: OrgRole.owner } },
          }),
        }),
      );
      expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 42 }, data: { activeOrgId: 1 } });
      expect(result).toEqual({ orgId: 1, role: OrgRole.owner });
    });
  });

  describe('switchOrg', () => {
    it('throws NotFoundException if user is not a member', async () => {
      mockPrisma.orgMember.findUnique.mockResolvedValue(null);
      await expect(service.switchOrg(1, 99)).rejects.toThrow(NotFoundException);
    });

    it('updates activeOrgId and returns orgId and role', async () => {
      mockPrisma.orgMember.findUnique.mockResolvedValue({ role: OrgRole.admin });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await service.switchOrg(1, 5);
      expect(result).toEqual({ orgId: 5, role: OrgRole.admin });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { activeOrgId: 5 } });
    });
  });

  describe('addMember', () => {
    it('throws ForbiddenException for member role', async () => {
      await expect(service.addMember(1, OrgRole.member, { email: 'a@b.com' })).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if target user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.addMember(1, OrgRole.admin, { email: 'x@y.com' })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if already a member', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.orgMember.findUnique.mockResolvedValue({ id: 1 });
      await expect(service.addMember(1, OrgRole.owner, { email: 'a@b.com' })).rejects.toThrow(BadRequestException);
    });

    it('creates member with default role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.orgMember.findUnique.mockResolvedValue(null);
      mockPrisma.orgMember.create.mockResolvedValue({
        userId: 2, role: OrgRole.member, createdAt: new Date(),
        user: { email: 'a@b.com', firstName: 'A', lastName: 'B' },
      });

      const result = await service.addMember(1, OrgRole.owner, { email: 'a@b.com' });
      expect(result.role).toBe(OrgRole.member);
    });
  });

  describe('removeMember', () => {
    it('throws ForbiddenException when removing owner', async () => {
      mockPrisma.orgMember.findUnique.mockResolvedValue({ role: OrgRole.owner });
      await expect(service.removeMember(1, OrgRole.owner, 99, 2)).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when admin removes admin', async () => {
      mockPrisma.orgMember.findUnique.mockResolvedValue({ role: OrgRole.admin });
      await expect(service.removeMember(1, OrgRole.admin, 99, 2)).rejects.toThrow(ForbiddenException);
    });

    it('deletes member successfully', async () => {
      mockPrisma.orgMember.findUnique.mockResolvedValue({ role: OrgRole.member });
      mockPrisma.orgMember.delete.mockResolvedValue({});
      await service.removeMember(1, OrgRole.admin, 99, 2);
      expect(mockPrisma.orgMember.delete).toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    it('throws ForbiddenException if actor is not owner', async () => {
      await expect(service.updateMemberRole(1, OrgRole.admin, 2, { role: OrgRole.member })).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when changing owner role', async () => {
      mockPrisma.orgMember.findUnique.mockResolvedValue({ role: OrgRole.owner, user: {} });
      await expect(service.updateMemberRole(1, OrgRole.owner, 2, { role: OrgRole.member })).rejects.toThrow(ForbiddenException);
    });
  });
});
