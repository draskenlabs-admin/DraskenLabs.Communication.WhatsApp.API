import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SsoService } from './sso.service';
import { UserService } from 'src/user/user.service';
import { OrgService } from 'src/org/org.service';
import { JwtService } from '@nestjs/jwt';
import { OrgRole } from '@prisma/client';

const mockSsoService = {
  exchangeCode: jest.fn(),
  decodeUserInfo: jest.fn(),
};

const mockUserService = {
  findOrCreateBySsoId: jest.fn(),
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
        { provide: SsoService, useValue: mockSsoService },
        { provide: UserService, useValue: mockUserService },
        { provide: OrgService, useValue: mockOrgService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();
    service = module.get<AuthService>(AuthService);
  });

  const dto = { code: 'code_123', codeVerifier: 'verifier_abc', redirectUri: 'https://app.com/callback' };

  describe('handleCallback', () => {
    it('exchanges code, provisions user and returns signed JWT', async () => {
      mockSsoService.exchangeCode.mockResolvedValue({ accessToken: 'sso_tok', refreshToken: 'ref', expiresIn: 86400 });
      mockSsoService.decodeUserInfo.mockReturnValue({ ssoId: 'sso_1', email: 'a@b.com', firstName: 'A', lastName: 'B' });
      const user = { id: 1, status: true, activeOrgId: 5, email: 'a@b.com', firstName: 'A' };
      mockUserService.findOrCreateBySsoId.mockResolvedValue(user);
      mockOrgService.getMemberRole.mockResolvedValue(OrgRole.owner);

      const result = await service.handleCallback(dto);

      expect(result.access_token).toBe('signed_token');
      expect(result.user).toEqual(user);
      expect(mockSsoService.exchangeCode).toHaveBeenCalledWith(dto.code, dto.codeVerifier, dto.redirectUri);
    });

    it('throws UnauthorizedException when account is deactivated', async () => {
      mockSsoService.exchangeCode.mockResolvedValue({ accessToken: 'sso_tok' });
      mockSsoService.decodeUserInfo.mockReturnValue({ ssoId: 'sso_1', email: 'a@b.com', firstName: 'A', lastName: 'B' });
      mockUserService.findOrCreateBySsoId.mockResolvedValue({ id: 1, status: false, activeOrgId: 5 });

      await expect(service.handleCallback(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user has no org after creation', async () => {
      mockSsoService.exchangeCode.mockResolvedValue({ accessToken: 'sso_tok' });
      mockSsoService.decodeUserInfo.mockReturnValue({ ssoId: 'sso_1', email: 'a@b.com', firstName: 'A', lastName: 'B' });
      mockUserService.findOrCreateBySsoId.mockResolvedValue({ id: 1, status: true, activeOrgId: null, firstName: 'A' });
      mockOrgService.createOrg.mockResolvedValue({ orgId: 10, role: OrgRole.owner });
      mockUserService.findById.mockResolvedValue({ id: 1, status: true, activeOrgId: null });

      await expect(service.handleCallback(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('creates org when user has none and retries', async () => {
      mockSsoService.exchangeCode.mockResolvedValue({ accessToken: 'sso_tok' });
      mockSsoService.decodeUserInfo.mockReturnValue({ ssoId: 'sso_1', email: 'a@b.com', firstName: 'A', lastName: 'B' });
      mockUserService.findOrCreateBySsoId.mockResolvedValue({ id: 1, status: true, activeOrgId: null, firstName: 'A' });
      mockOrgService.createOrg.mockResolvedValue({ orgId: 10, role: OrgRole.owner });
      mockUserService.findById.mockResolvedValue({ id: 1, status: true, activeOrgId: 10, email: 'a@b.com' });
      mockOrgService.getMemberRole.mockResolvedValue(OrgRole.owner);

      const result = await service.handleCallback(dto);
      expect(result.access_token).toBe('signed_token');
      expect(mockOrgService.createOrg).toHaveBeenCalled();
    });

    it('throws when SSO exchange fails', async () => {
      mockSsoService.exchangeCode.mockRejectedValue(new UnauthorizedException('SSO token exchange failed'));
      await expect(service.handleCallback(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('throws when user is not in any org', async () => {
      mockSsoService.exchangeCode.mockResolvedValue({ accessToken: 'sso_tok' });
      mockSsoService.decodeUserInfo.mockReturnValue({ ssoId: 'sso_1', email: 'a@b.com', firstName: 'A', lastName: 'B' });
      mockUserService.findOrCreateBySsoId.mockResolvedValue({ id: 1, status: true, activeOrgId: 5, email: 'a@b.com' });
      mockOrgService.getMemberRole.mockResolvedValue(null);

      await expect(service.handleCallback(dto)).rejects.toThrow(UnauthorizedException);
    });
  });
});
