import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const user = { id: 1, email: 'a@b.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(service.findById(1)).resolves.toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findById(99)).resolves.toBeNull();
    });
  });

  describe('findBySsoId', () => {
    it('returns user by ssoId', async () => {
      const user = { id: 1, ssoId: 'sso_123' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(service.findBySsoId('sso_123')).resolves.toEqual(user);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { ssoId: 'sso_123' } });
    });

    it('returns null when not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findBySsoId('missing')).resolves.toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns user by email', async () => {
      const user = { id: 1, email: 'a@b.com' };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      await expect(service.findByEmail('a@b.com')).resolves.toEqual(user);
    });
  });

  describe('findOrCreateBySsoId', () => {
    const data = { ssoId: 'sso_1', email: 'a@b.com', firstName: 'A', lastName: 'B' };

    it('returns existing user if found', async () => {
      const existing = { id: 1, ...data };
      mockPrisma.user.findUnique.mockResolvedValue(existing);
      const result = await service.findOrCreateBySsoId(data);
      expect(result).toEqual(existing);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('creates and returns new user when not found', async () => {
      const created = { id: 2, ...data };
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(created);
      const result = await service.findOrCreateBySsoId(data);
      expect(result).toEqual(created);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({ data });
    });
  });
});
