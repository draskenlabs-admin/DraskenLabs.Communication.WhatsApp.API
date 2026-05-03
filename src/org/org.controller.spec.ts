import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { OrgRole } from '@prisma/client';
import { OrgController } from './org.controller';
import { OrgService } from './org.service';
import { JwtService } from '@nestjs/jwt';

const mockOrgService = {
  getUserOrgs: jest.fn(),
  createOrgForUser: jest.fn(),
  switchOrg: jest.fn(),
  getOrg: jest.fn(),
  updateOrg: jest.fn(),
  getMembers: jest.fn(),
  addMember: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
};

const mockJwtService = { signAsync: jest.fn().mockResolvedValue('new_token') };

const makeReq = (overrides: any = {}) => ({
  user: { id: 1, email: 'a@b.com' },
  orgId: 5,
  role: OrgRole.owner,
  ...overrides,
}) as any;

describe('OrgController', () => {
  let controller: OrgController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrgController],
      providers: [
        { provide: OrgService, useValue: mockOrgService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    controller = module.get<OrgController>(OrgController);
  });

  describe('getMyOrgs', () => {
    it('returns user orgs', async () => {
      const req = makeReq();
      mockOrgService.getUserOrgs.mockResolvedValue([{ id: 5, name: 'Acme' }]);
      await expect(controller.getMyOrgs(req)).resolves.toEqual([{ id: 5, name: 'Acme' }]);
    });

    it('throws when user missing', () => {
      expect(() => controller.getMyOrgs({} as any)).toThrow(UnauthorizedException);
    });
  });

  describe('createOrg', () => {
    it('creates org and issues new JWT', async () => {
      const req = makeReq();
      mockOrgService.createOrgForUser.mockResolvedValue({ orgId: 10, role: OrgRole.owner });
      const result = await controller.createOrg(req, { name: 'New Org' });
      expect(result.access_token).toBe('new_token');
      expect(result.orgId).toBe(10);
    });
  });

  describe('switchOrg', () => {
    it('switches org and issues new JWT', async () => {
      const req = makeReq();
      mockOrgService.switchOrg.mockResolvedValue({ orgId: 7, role: OrgRole.admin });
      const result = await controller.switchOrg(req, { orgId: 7 });
      expect(result.access_token).toBe('new_token');
      expect(result.orgId).toBe(7);
    });
  });

  describe('getOrg', () => {
    it('returns org details', async () => {
      mockOrgService.getOrg.mockResolvedValue({ id: 5, name: 'Acme' });
      await expect(controller.getOrg(makeReq())).resolves.toEqual({ id: 5, name: 'Acme' });
    });
  });

  describe('updateOrg', () => {
    it('updates org name', async () => {
      mockOrgService.updateOrg.mockResolvedValue({ id: 5, name: 'New Name' });
      await expect(controller.updateOrg(makeReq(), { name: 'New Name' })).resolves.toEqual({ id: 5, name: 'New Name' });
    });
  });

  describe('getMembers', () => {
    it('returns org members', async () => {
      mockOrgService.getMembers.mockResolvedValue([{ userId: 1 }]);
      await expect(controller.getMembers(makeReq())).resolves.toEqual([{ userId: 1 }]);
    });
  });

  describe('addMember', () => {
    it('adds a member', async () => {
      const member = { userId: 2, email: 'b@c.com', role: OrgRole.member };
      mockOrgService.addMember.mockResolvedValue(member);
      await expect(controller.addMember(makeReq(), { email: 'b@c.com' } as any)).resolves.toEqual(member);
    });
  });

  describe('updateRole', () => {
    it('updates a member role', async () => {
      const updated = { userId: 2, role: OrgRole.admin };
      mockOrgService.updateMemberRole.mockResolvedValue(updated);
      await expect(controller.updateRole(makeReq(), 2, { role: OrgRole.admin })).resolves.toEqual(updated);
    });
  });

  describe('removeMember', () => {
    it('removes a member', async () => {
      mockOrgService.removeMember.mockResolvedValue(undefined);
      await expect(controller.removeMember(makeReq(), 2)).resolves.toBeUndefined();
      expect(mockOrgService.removeMember).toHaveBeenCalledWith(5, OrgRole.owner, 1, 2);
    });
  });
});
