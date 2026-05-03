import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

const mockContactsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

const makeReq = (orgId?: number) => ({ orgId } as any);

describe('ContactsController', () => {
  let controller: ContactsController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: mockContactsService }],
    }).compile();
    controller = module.get<ContactsController>(ContactsController);
  });

  describe('create', () => {
    it('creates a contact', async () => {
      const dto = { phoneNumber: '+1555', firstName: 'A' } as any;
      mockContactsService.create.mockResolvedValue({ id: 1, ...dto });
      await expect(controller.create(makeReq(2), dto)).resolves.toEqual({ id: 1, ...dto });
      expect(mockContactsService.create).toHaveBeenCalledWith(2, dto);
    });

    it('throws when orgId missing', () => {
      expect(() => controller.create(makeReq(), {} as any)).toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('returns all contacts', async () => {
      mockContactsService.findAll.mockResolvedValue([{ id: 1 }]);
      await expect(controller.findAll(makeReq(2))).resolves.toEqual([{ id: 1 }]);
    });

    it('throws when orgId missing', () => {
      expect(() => controller.findAll(makeReq())).toThrow(UnauthorizedException);
    });
  });

  describe('findOne', () => {
    it('returns a single contact', async () => {
      mockContactsService.findOne.mockResolvedValue({ id: 1 });
      await expect(controller.findOne(makeReq(2), 1)).resolves.toEqual({ id: 1 });
      expect(mockContactsService.findOne).toHaveBeenCalledWith(2, 1);
    });
  });

  describe('update', () => {
    it('updates a contact', async () => {
      const dto = { firstName: 'B' } as any;
      mockContactsService.update.mockResolvedValue({ id: 1, firstName: 'B' });
      await expect(controller.update(makeReq(2), 1, dto)).resolves.toEqual({ id: 1, firstName: 'B' });
    });
  });

  describe('remove', () => {
    it('removes a contact', async () => {
      mockContactsService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(makeReq(2), 1)).resolves.toBeUndefined();
      expect(mockContactsService.remove).toHaveBeenCalledWith(2, 1);
    });
  });
});
