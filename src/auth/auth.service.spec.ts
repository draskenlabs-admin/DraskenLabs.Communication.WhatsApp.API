import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ClerkService } from './clerk.service';
import { UserService } from 'src/user/user.service';
import { OrgService } from 'src/org/org.service';
import { JwtService } from '@nestjs/jwt';
import { OrgRole } from '@prisma/client';

const mockClerkService = {
  createUser: jest.fn(),
  signInWithPassword: jest.fn(),
  getUserById: jest.fn(),
};

const mockUserService = {
  findOrCreateByClerkId: jest.fn(),
  findByClerkId: jest.fn(),
  findById: jest.fn(),
};

const mockOrgService = {
  createOrg: jest.fn(),
  getMemberRole: jest.fn(),
};

const mockJwtService = { signAsync: jest.fn().mockResolvedValue('signed_token') };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ClerkService, useValue: mockClerkService },
        { provide: UserService, useValue: mockUserService },
        { provide: OrgService, useValue: mockOrgService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  describe('signup', () => {
    it('creates Clerk user, provisions local user and org, returns token', async () => {
      const clerkUser = {
        id: 'clerk_1',
        email_addresses: [{ email_address: 'a@b.com' }],
        first_name: 'A',
        last_name: 'B',
      };
      const user = { id: 1, email: 'a@b.com', firstName: 'A', lastName: 'B' };

      mockClerkService.createUser.mockResolvedValue(clerkUser);
      mockUserService.findOrCreateByClerkId.mockResolvedValue(user);
      mockOrgService.createOrg.mockResolvedValue({ orgId: 10, role: OrgRole.owner });

      const result = await service.signup({ email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B' });

      expect(result.access_token).toBe('signed_token');
      expect(result.user).toEqual(user);
      expect(mockOrgService.createOrg).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws UnauthorizedException when user is deactivated', async () => {
      mockClerkService.signInWithPassword.mockResolvedValue('clerk_1');
      mockUserService.findByClerkId.mockResolvedValue({ id: 1, status: false, activeOrgId: 1 });

      await expect(service.login({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user has no org', async () => {
      mockClerkService.signInWithPassword.mockResolvedValue('clerk_1');
      mockUserService.findByClerkId.mockResolvedValue({ id: 1, status: true, activeOrgId: null });

      await expect(service.login({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user is not in any org', async () => {
      mockClerkService.signInWithPassword.mockResolvedValue('clerk_1');
      mockUserService.findByClerkId.mockResolvedValue({ id: 1, status: true, activeOrgId: 5, email: 'a@b.com' });
      mockOrgService.getMemberRole.mockResolvedValue(null);

      await expect(service.login({ email: 'a@b.com', password: 'pass' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns token for valid active user', async () => {
      mockClerkService.signInWithPassword.mockResolvedValue('clerk_1');
      mockUserService.findByClerkId.mockResolvedValue({ id: 1, status: true, activeOrgId: 5, email: 'a@b.com' });
      mockOrgService.getMemberRole.mockResolvedValue(OrgRole.owner);

      const result = await service.login({ email: 'a@b.com', password: 'pass' });

      expect(result.access_token).toBe('signed_token');
    });

    it('provisions user and org when Clerk user exists but local user does not', async () => {
      const clerkUser = {
        id: 'clerk_1',
        email_addresses: [{ email_address: 'a@b.com' }],
        first_name: 'A',
        last_name: 'B',
      };
      mockClerkService.signInWithPassword.mockResolvedValue('clerk_1');
      mockUserService.findByClerkId.mockResolvedValueOnce(null);
      mockClerkService.getUserById.mockResolvedValue(clerkUser);
      const provisioned = { id: 2, firstName: 'A', email: 'a@b.com' };
      mockUserService.findOrCreateByClerkId.mockResolvedValue(provisioned);
      mockOrgService.createOrg.mockResolvedValue({ orgId: 10, role: OrgRole.owner });
      const fullUser = { id: 2, status: true, activeOrgId: 10, email: 'a@b.com' };
      mockUserService.findById.mockResolvedValue(fullUser);
      mockOrgService.getMemberRole.mockResolvedValue(OrgRole.owner);

      const result = await service.login({ email: 'a@b.com', password: 'pass' });
      expect(result.access_token).toBe('signed_token');
    });
  });
});
