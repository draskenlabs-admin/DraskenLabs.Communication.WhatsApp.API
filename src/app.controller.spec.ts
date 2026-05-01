import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should return API root info', () => {
    const result = appController.getHello();
    expect(result).toMatchObject({
      name: 'Communication WhatsApp API',
      docs: '/swagger/docs',
      openApiJson: '/swagger/json',
    });
  });
});
