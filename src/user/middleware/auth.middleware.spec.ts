import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthMiddleware } from './auth.middleware';
import { UserService } from '../user.service';
import { RedisService } from 'src/redis/redis.service';

const mockJwt = { verifyAsync: jest.fn() };
const mockUserService = { findById: jest.fn() };
const mockRedis = { getUserCache: jest.fn(), setUserCache: jest.fn() };

const baseUser = { id: 1, clerkId: 'cl_1', email: 'a@b.com', firstName: 'A', lastName: 'B', status: true };

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        { provide: JwtService, useValue: mockJwt },
        { provide: UserService, useValue: mockUserService },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();
    middleware = module.get<AuthMiddleware>(AuthMiddleware);
  });

  const makeReq = (token?: string) => ({
    headers: { authorization: token ? `Bearer ${token}` : undefined },
  });

  it('throws UnauthorizedException if no authorization header', async () => {
    await expect(middleware.use(makeReq() as any, {} as any, jest.fn())).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException if JWT verification fails', async () => {
    mockJwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));
    await expect(middleware.use(makeReq('bad.token') as any, {} as any, jest.fn())).rejects.toThrow(UnauthorizedException);
  });

  it('uses cached user and calls next()', async () => {
    mockJwt.verifyAsync.mockResolvedValue({ sub: 1, orgId: 2, role: 'admin' });
    mockRedis.getUserCache.mockResolvedValue(baseUser);

    const req: any = makeReq('valid.token');
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(req.user).toEqual(baseUser);
    expect(req.orgId).toBe(2);
    expect(req.role).toBe('admin');
    expect(next).toHaveBeenCalled();
    expect(mockUserService.findById).not.toHaveBeenCalled();
  });

  it('fetches from DB on cache miss and caches result', async () => {
    mockJwt.verifyAsync.mockResolvedValue({ sub: 1, orgId: 2, role: 'member' });
    mockRedis.getUserCache.mockResolvedValue(null);
    mockUserService.findById.mockResolvedValue(baseUser);

    const req: any = makeReq('valid.token');
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(mockUserService.findById).toHaveBeenCalledWith(1);
    expect(mockRedis.setUserCache).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('throws UnauthorizedException if account is deactivated', async () => {
    mockJwt.verifyAsync.mockResolvedValue({ sub: 1, orgId: 2, role: 'member' });
    mockRedis.getUserCache.mockResolvedValue({ ...baseUser, status: false });

    await expect(middleware.use(makeReq('valid.token') as any, {} as any, jest.fn())).rejects.toThrow(UnauthorizedException);
  });
});
