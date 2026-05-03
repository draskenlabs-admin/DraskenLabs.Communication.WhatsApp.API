import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthCallbackDto } from './dto/callback.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthorizeQueryDto, AuthorizeResponseDto } from './dto/authorize.dto';
import { ApiStandardErrorResponses, ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('authorize')
  @ApiOperation({
    summary: 'Get SSO authorize URL',
    description:
      'Generates a PKCE state token and returns the full `accounts.drasken.dev/authorize` URL. ' +
      'Redirect the user to this URL to begin the SSO login flow. ' +
      'Pass the `codeChallenge` (SHA-256 hash of your locally generated `codeVerifier`, base64url encoded) ' +
      'and the `redirectUri` where SSO should redirect after authentication.',
  })
  @ApiWrappedOkResponse({ dataDto: AuthorizeResponseDto, description: 'SSO authorize URL and state token' })
  @ApiStandardErrorResponses({ validation: true })
  async authorize(@Query() query: AuthorizeQueryDto): Promise<AuthorizeResponseDto> {
    return this.authService.getAuthorizeUrl(query.redirectUri, query.codeChallenge);
  }

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
