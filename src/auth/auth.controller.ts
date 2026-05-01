import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import {
  ApiStandardErrorResponses,
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from 'src/common/responses/swagger.decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user account via Clerk' })
  @ApiWrappedCreatedResponse({ dataDto: AuthResponseDto, description: 'User registered successfully' })
  @ApiStandardErrorResponses({ badRequest: true, conflict: true, validation: true })
  async signup(@Body() dto: SignupDto): Promise<AuthResponseDto> {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password via Clerk' })
  @ApiWrappedOkResponse({ dataDto: AuthResponseDto, description: 'Login successful' })
  @ApiStandardErrorResponses({ unauthorized: true, validation: true })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }
}
