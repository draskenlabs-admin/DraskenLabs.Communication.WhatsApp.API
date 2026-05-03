import { Test, TestingModule } from '@nestjs/testing';
import { UserWhatsappService } from './user-whatsapp.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EncryptionService } from 'src/common/services/crypto.service';

const mockPrisma = {
  userWhatsapp: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockEncryption = {
  encrypt: jest.fn().mockReturnValue('encrypted_token'),
  decrypt: jest.fn().mockReturnValue('plain_token'),
};

describe('UserWhatsappService', () => {
  let service: UserWhatsappService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserWhatsappService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: EncryptionService, useValue: mockEncryption },
      ],
    }).compile();
    service = module.get<UserWhatsappService>(UserWhatsappService);
  });

  describe('createOrUpdate', () => {
    it('encrypts the access token before persisting', async () => {
      mockPrisma.userWhatsapp.upsert.mockResolvedValue({ accessToken: 'encrypted_token' });

      await service.createOrUpdate({ userId: 1, businessId: 'b1', wabaId: 'w1', accessToken: 'raw_token' });

      expect(mockEncryption.encrypt).toHaveBeenCalledWith('raw_token');
      expect(mockPrisma.userWhatsapp.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ accessToken: 'encrypted_token' }),
          update: expect.objectContaining({ accessToken: 'encrypted_token' }),
        }),
      );
    });
  });

  describe('getEncryptedToken', () => {
    it('returns encrypted token when record exists', async () => {
      mockPrisma.userWhatsapp.findUnique.mockResolvedValue({ accessToken: 'enc' });
      await expect(service.getEncryptedToken(1, 'w1')).resolves.toBe('enc');
    });

    it('returns null when record not found', async () => {
      mockPrisma.userWhatsapp.findUnique.mockResolvedValue(null);
      await expect(service.getEncryptedToken(1, 'w1')).resolves.toBeNull();
    });
  });

  describe('getDecryptedToken', () => {
    it('decrypts and returns token', async () => {
      mockPrisma.userWhatsapp.findUnique.mockResolvedValue({ accessToken: 'encrypted_token' });
      const result = await service.getDecryptedToken(1, 'w1');
      expect(mockEncryption.decrypt).toHaveBeenCalledWith('encrypted_token');
      expect(result).toBe('plain_token');
    });

    it('returns null when record not found', async () => {
      mockPrisma.userWhatsapp.findUnique.mockResolvedValue(null);
      await expect(service.getDecryptedToken(1, 'w1')).resolves.toBeNull();
    });
  });

  describe('findAllByUserId', () => {
    it('returns all records for user', async () => {
      const records = [{ userId: 1, wabaId: 'w1' }, { userId: 1, wabaId: 'w2' }];
      mockPrisma.userWhatsapp.findMany.mockResolvedValue(records);
      await expect(service.findAllByUserId(1)).resolves.toEqual(records);
      expect(mockPrisma.userWhatsapp.findMany).toHaveBeenCalledWith({ where: { userId: 1 } });
    });
  });
});
