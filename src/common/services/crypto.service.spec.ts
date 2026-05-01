import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { EncryptionService } from './crypto.service';

const VALID_KEY = Buffer.alloc(32).toString('base64'); // 32 zero bytes → valid base64 key

function makeModule(key: string | undefined) {
  return Test.createTestingModule({
    providers: [
      EncryptionService,
      { provide: ConfigService, useValue: { get: () => key } },
    ],
  }).compile();
}

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(async () => {
    const module: TestingModule = await makeModule(VALID_KEY);
    service = module.get<EncryptionService>(EncryptionService);
  });

  describe('constructor', () => {
    it('throws InternalServerErrorException when ENCRYPTION_KEY is not set', async () => {
      await expect(makeModule(undefined)).rejects.toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException when key decodes to wrong length', async () => {
      const shortKey = Buffer.alloc(16).toString('base64'); // 16 bytes — invalid
      await expect(makeModule(shortKey)).rejects.toThrow(InternalServerErrorException);
    });

    it('initialises successfully with a valid 32-byte key', () => {
      expect(service).toBeDefined();
    });
  });

  describe('encrypt', () => {
    it('returns a string in iv:tag:data format', () => {
      const result = service.encrypt('hello');
      const parts = result.split(':');
      expect(parts).toHaveLength(3);
      parts.forEach((part) => expect(part.length).toBeGreaterThan(0));
    });

    it('produces different ciphertext for the same plaintext each call', () => {
      const a = service.encrypt('same text');
      const b = service.encrypt('same text');
      expect(a).not.toBe(b);
    });
  });

  describe('decrypt', () => {
    it('round-trips: decrypt(encrypt(text)) === text', () => {
      const plaintext = 'super secret value';
      expect(service.decrypt(service.encrypt(plaintext))).toBe(plaintext);
    });

    it('throws InternalServerErrorException on tampered ciphertext', () => {
      const encrypted = service.encrypt('data');
      const tampered = encrypted.slice(0, -4) + 'XXXX';
      expect(() => service.decrypt(tampered)).toThrow(InternalServerErrorException);
    });

    it('throws InternalServerErrorException on malformed payload', () => {
      expect(() => service.decrypt('not:valid')).toThrow(InternalServerErrorException);
    });
  });
});
