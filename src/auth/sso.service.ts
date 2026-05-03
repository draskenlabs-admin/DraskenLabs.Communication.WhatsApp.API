import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

interface SsoTokenData {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SsoUserInfo {
  ssoId: string;
  email: string;
  firstName: string;
  lastName: string;
  ssoOrgId: string | null;
  role: string | null;
}

@Injectable()
export class SsoService {
  private readonly apiBase: string;
  private readonly accountsBase: string;
  private readonly clientId: string;

  constructor(private readonly config: ConfigService) {
    this.apiBase = config.getOrThrow<string>('SSO_API_URL');
    this.accountsBase = config.getOrThrow<string>('SSO_ACCOUNTS_URL');
    this.clientId = config.getOrThrow<string>('SSO_CLIENT_ID');
  }

  getAuthorizeUrl(
    redirectUri: string,
    codeChallenge: string,
    state: string,
    codeChallengeMethod = 'S256',
  ): string {
    const params = new URLSearchParams({
      clientId: this.clientId,
      redirectUri,
      codeChallenge,
      codeChallengeMethod,
      state,
    });
    return `${this.accountsBase}/authorize?${params}`;
  }

  async exchangeCode(code: string, codeVerifier: string, redirectUri: string): Promise<SsoTokenData> {
    try {
      const { data } = await axios.post(`${this.apiBase}/auth/token`, {
        clientId: this.clientId,
        code,
        codeVerifier,
        redirectUri,
      });
      return data.data as SsoTokenData;
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      const msg = error.response?.data?.message ?? 'SSO token exchange failed';
      throw new UnauthorizedException(msg);
    }
  }

  decodeUserInfo(accessToken: string): SsoUserInfo {
    try {
      const [, payload] = accessToken.split('.');
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));

      const ssoId: string = decoded.sub;
      const email: string = decoded.email;
      const firstName: string = decoded.firstName ?? decoded.given_name ?? decoded.first_name ?? '';
      const lastName: string = decoded.lastName ?? decoded.family_name ?? decoded.last_name ?? '';

      if (!ssoId || !email) {
        throw new Error('Missing required claims in SSO token');
      }

      const ssoOrgId: string | null =
        decoded.orgId ?? decoded.org_id ?? decoded.activeOrgId ?? decoded.active_org_id ?? null;

      const role: string | null =
        decoded.role ?? decoded.orgRole ?? decoded.org_role ?? null;

      return { ssoId, email, firstName, lastName, ssoOrgId, role };
    } catch {
      throw new UnauthorizedException('Failed to decode SSO token');
    }
  }
}
