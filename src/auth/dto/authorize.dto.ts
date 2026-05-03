import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthorizeQueryDto {
  @ApiProperty({ description: 'Redirect URI that SSO will redirect to after authentication' })
  @IsString()
  @IsNotEmpty()
  redirectUri: string;

  @ApiProperty({ description: 'PKCE code challenge — SHA-256 hash of codeVerifier, base64url encoded' })
  @IsString()
  @IsNotEmpty()
  codeChallenge: string;
}

export class AuthorizeResponseDto {
  @ApiProperty({ description: 'Full SSO authorize URL — redirect the user here' })
  url: string;

  @ApiProperty({ description: 'State token — pass this back on the callback to correlate the request' })
  state: string;
}
