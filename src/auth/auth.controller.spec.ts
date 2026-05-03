import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  signup: jest.fn(),
  login: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('signup delegates to AuthService', async () => {
    const dto = { email: 'a@b.com', password: 'pass', firstName: 'A', lastName: 'B' };
    const response = { access_token: 'tok', user: {} };
    mockAuthService.signup.mockResolvedValue(response);

    await expect(controller.signup(dto as any)).resolves.toEqual(response);
    expect(mockAuthService.signup).toHaveBeenCalledWith(dto);
  });

  it('login delegates to AuthService', async () => {
    const dto = { email: 'a@b.com', password: 'pass' };
    const response = { access_token: 'tok', user: {} };
    mockAuthService.login.mockResolvedValue(response);

    await expect(controller.login(dto as any)).resolves.toEqual(response);
    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
  });
});
