import { Test, TestingModule } from '@nestjs/testing';
import { ConnectController } from './connect.controller';
import { ConnectService } from './connect.service';

describe('ConnectController', () => {
  let controller: ConnectController;
  let connectService: jest.Mocked<ConnectService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectController],
      providers: [
        { provide: ConnectService, useValue: { connectWhatsapp: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ConnectController>(ConnectController);
    connectService = module.get(ConnectService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call connectWhatsapp with user context', async () => {
    const mockResult = { wabaId: 'w1', businessId: 'b1', phoneNumbers: [] };
    connectService.connectWhatsapp.mockResolvedValue(mockResult as any);

    const req = { user: { id: 1 }, orgId: 2 } as any;
    const dto = { code: 'c', wabaId: 'w1', businessId: 'b1' } as any;

    const result = await controller.connectWhatsApp(dto, req);
    expect(connectService.connectWhatsapp).toHaveBeenCalledWith(dto, 1, 2);
    expect(result).toEqual(mockResult);
  });
});
