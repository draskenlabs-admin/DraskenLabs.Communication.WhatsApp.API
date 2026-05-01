import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { WabaService } from './waba.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';
import { RedisService } from 'src/redis/redis.service';

const mockPrisma = {
  waba: { findFirst: jest.fn(), findMany: jest.fn(), upsert: jest.fn() },
  userWhatsapp: { findFirst: jest.fn(), findUnique: jest.fn(), delete: jest.fn() },
  wabaPhoneNumber: { findMany: jest.fn() },
};

const mockEncryption = { decrypt: jest.fn().mockReturnValue('plain_token') };
const mockRedis = { invalidatePhoneCache: jest.fn() };

describe('WabaService', () => {
  let service: WabaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WabaService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EncryptionService, useValue: mockEncryption },
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();
    service = module.get<WabaService>(WabaService);
  });

  describe('disconnectWaba', () => {
    it('throws NotFoundException if WABA not in org', async () => {
      mockPrisma.waba.findFirst.mockResolvedValue(null);
      await expect(service.disconnectWaba(1, 1, 'w1')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException if user does not own the connection', async () => {
      mockPrisma.waba.findFirst.mockResolvedValue({ wabaId: 'w1' });
      mockPrisma.userWhatsapp.findUnique.mockResolvedValue(null);
      await expect(service.disconnectWaba(1, 1, 'w1')).rejects.toThrow(ForbiddenException);
    });

    it('invalidates phone cache for all phone numbers and deletes connection', async () => {
      mockPrisma.waba.findFirst.mockResolvedValue({ wabaId: 'w1' });
      mockPrisma.userWhatsapp.findUnique.mockResolvedValue({ userId: 1, wabaId: 'w1' });
      mockPrisma.wabaPhoneNumber.findMany.mockResolvedValue([
        { phoneNumberId: 'p1' },
        { phoneNumberId: 'p2' },
      ]);
      mockPrisma.userWhatsapp.delete.mockResolvedValue({});

      await service.disconnectWaba(1, 1, 'w1');

      expect(mockRedis.invalidatePhoneCache).toHaveBeenCalledWith('p1');
      expect(mockRedis.invalidatePhoneCache).toHaveBeenCalledWith('p2');
      expect(mockPrisma.userWhatsapp.delete).toHaveBeenCalledWith({
        where: { userId_wabaId: { userId: 1, wabaId: 'w1' } },
      });
    });

    it('works when WABA has no phone numbers', async () => {
      mockPrisma.waba.findFirst.mockResolvedValue({ wabaId: 'w1' });
      mockPrisma.userWhatsapp.findUnique.mockResolvedValue({ userId: 1, wabaId: 'w1' });
      mockPrisma.wabaPhoneNumber.findMany.mockResolvedValue([]);
      mockPrisma.userWhatsapp.delete.mockResolvedValue({});

      await service.disconnectWaba(1, 1, 'w1');

      expect(mockRedis.invalidatePhoneCache).not.toHaveBeenCalled();
      expect(mockPrisma.userWhatsapp.delete).toHaveBeenCalled();
    });
  });
});
