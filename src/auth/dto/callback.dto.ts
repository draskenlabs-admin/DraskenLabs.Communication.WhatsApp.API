import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AuthCallbackDto {
  @ApiProperty({ description: 'Authorization code received from SSO callback' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'PKCE code verifier generated before the redirect' })
  @IsString()
  @IsNotEmpty()
  codeVerifier: string;

  @ApiProperty({ description: 'The redirect URI used in the original authorize request', example: 'https://myapp.com/callback' })
  @IsString()
  @IsNotEmpty()
  redirectUri: string;
}
