import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCallbackDto } from './dto/callback.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ApiStandardErrorResponses, ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange SSO auth code for an access token',
    description:
      'Completes the PKCE flow. The client directs the user to `accounts.drasken.dev/authorize`, ' +
      'receives a `code` in the callback, then calls this endpoint with the code and the original ' +
      '`codeVerifier` to obtain a signed JWT for this API.',
  })
  @ApiWrappedOkResponse({ dataDto: AuthResponseDto, description: 'Authenticated successfully' })
  @ApiStandardErrorResponses({ unauthorized: true, validation: true })
  async callback(@Body() dto: AuthCallbackDto): Promise<AuthResponseDto> {
    return this.authService.handleCallback(dto);
  }
}
