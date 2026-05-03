import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';

const mockTemplatesService = {
  syncTemplates: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
};

describe('TemplatesController', () => {
  let controller: TemplatesController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [{ provide: TemplatesService, useValue: mockTemplatesService }],
    }).compile();
    controller = module.get<TemplatesController>(TemplatesController);
  });

  describe('sync', () => {
    it('syncs templates from Meta', async () => {
      const req = { user: { id: 1 }, orgId: 2 } as any;
      const response = { synced: 3, total: 3 };
      mockTemplatesService.syncTemplates.mockResolvedValue(response);

      await expect(controller.sync(req, 'w1')).resolves.toEqual(response);
      expect(mockTemplatesService.syncTemplates).toHaveBeenCalledWith(1, 2, 'w1');
    });

    it('throws when user or org missing', async () => {
      await expect(controller.sync({} as any, 'w1')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('returns all templates for org', async () => {
      const req = { orgId: 2 } as any;
      mockTemplatesService.findAll.mockResolvedValue([{ id: 1 }]);
      await expect(controller.findAll(req, undefined)).resolves.toEqual([{ id: 1 }]);
      expect(mockTemplatesService.findAll).toHaveBeenCalledWith(2, undefined);
    });

    it('filters by wabaId when provided', async () => {
      const req = { orgId: 2 } as any;
      mockTemplatesService.findAll.mockResolvedValue([]);
      await controller.findAll(req, 'w1');
      expect(mockTemplatesService.findAll).toHaveBeenCalledWith(2, 'w1');
    });

    it('throws when orgId missing', async () => {
      await expect(controller.findAll({} as any, undefined)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findOne', () => {
    it('returns a single template', async () => {
      const req = { orgId: 2 } as any;
      mockTemplatesService.findOne.mockResolvedValue({ id: 3 });
      await expect(controller.findOne(req, 3)).resolves.toEqual({ id: 3 });
      expect(mockTemplatesService.findOne).toHaveBeenCalledWith(2, 3);
    });

    it('throws when orgId missing', async () => {
      await expect(controller.findOne({} as any, 3)).rejects.toThrow(UnauthorizedException);
    });
  });
});
