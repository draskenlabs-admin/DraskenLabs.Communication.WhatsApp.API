import { Injectable } from '@nestjs/common';
import { ConnectURLResponseDTO } from './dto/connect-url-response.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ConnectService {
  constructor(private readonly configService: ConfigService) {}

  async connectService(): Promise<ConnectURLResponseDTO> {
    const scopes = [
      'whatsapp_business_management',
      'whatsapp_business_messaging',
      'business_management',
    ].join(',');

    return {
      url: `https://www.facebook.com/v25.0/dialog/oauth?client_id=${this.configService.get('META_APP_ID')}&redirect_uri=${encodeURIComponent(this.configService.get('META_REDIRECT_URI') ?? '')}&scope=${scopes}&response_type=code`,
    };
  }

  async callbackRedirect(code: string): Promise<string> {
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v25.0/oauth/access_token`,
      {
        params: {
          client_id: this.configService.get('META_APP_ID') ?? '',
          client_secret: this.configService.get('META_APP_SECRET') ?? '',
          redirect_uri: this.configService.get('META_REDIRECT_URI') ?? '',
          code,
        },
      },
    );
    const accessToken = tokenRes.data.access_token;
    return accessToken;
  }

  async getBusinesses(accessToken: string): Promise<any> {
    const profileRes = await axios.get(
      `https://graph.facebook.com/v25.0/me/businesses`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const data = profileRes.data;
    return data;
  }
}
