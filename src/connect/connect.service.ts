import { BadRequestException, Injectable } from '@nestjs/common';
import { ConnectURLResponseDTO } from './dto/connect-url-response.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from 'src/redis/redis.service';
import { WABABusinesses } from 'src/redis/dto/waba-connect-state.dto';
import { WABANumberModel } from './dto/waba-number.dto';

@Injectable()
export class ConnectService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async connectService(): Promise<ConnectURLResponseDTO> {
    const scopes = [
      'whatsapp_business_management',
      'whatsapp_business_messaging',
      'business_management',
    ].join(',');
    const stateId = await this.redisService.createState();
    let redirectURI = new URL(
      this.configService.get('META_REDIRECT_URI') ?? '',
    );
    redirectURI.searchParams.set('state', stateId);
    return {
      url: `https://www.facebook.com/v25.0/dialog/oauth?client_id=${this.configService.get('META_APP_ID')}&redirect_uri=${encodeURIComponent(redirectURI.toString())}&scope=${scopes}&response_type=code`,
    };
  }

  async callbackRedirect(code: string, state: string): Promise<string> {
    let stateData = await this.redisService.getState(state);
    if (!stateData) throw new BadRequestException('Invalid state provided');

    let redirectURI = new URL(
      this.configService.get('META_REDIRECT_URI') ?? '',
    );
    redirectURI.searchParams.set('state', state);
    const tokenRes = await axios.get(
      `https://graph.facebook.com/v25.0/oauth/access_token`,
      {
        params: {
          client_id: this.configService.get('META_APP_ID') ?? '',
          client_secret: this.configService.get('META_APP_SECRET') ?? '',
          redirect_uri: redirectURI,
          code,
        },
      },
    );
    const accessToken = tokenRes.data.access_token;
    await this.redisService.updateState(state, {
      accessToken: accessToken,
      businesses: [],
    });
    return accessToken;
  }

  async getBusinesses(state: string): Promise<WABABusinesses[]> {
    const stateData = await this.redisService.getState(state);
    if (!stateData) throw new BadRequestException('Invalid state provided');

    const profileRes = await axios.get(
      `https://graph.facebook.com/v25.0/me/businesses`,
      {
        headers: { Authorization: `Bearer ${stateData.accessToken}` },
      },
    );
    const data = profileRes.data;
    return data.data;
  }

  async getOwnedWABAs(
    businessId: string,
    state: string,
  ): Promise<WABANumberModel[]> {
    const stateData = await this.redisService.getState(state);
    if (!stateData) throw new BadRequestException('Invalid state provided');

    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${businessId}/owned_whatsapp_business_accounts`,
      {
        headers: { Authorization: `Bearer ${stateData.accessToken}` },
      },
    );
    const data = response.data;
    return data.data;
  }

  async getClientWABAs(
    businessId: string,
    state: string,
  ): Promise<WABANumberModel[]> {
    const stateData = await this.redisService.getState(state);
    if (!stateData) throw new BadRequestException('Invalid state provided');

    const response = await axios.get(
      `https://graph.facebook.com/v25.0/${businessId}/client_whatsapp_business_accounts`,
      {
        headers: { Authorization: `Bearer ${stateData.accessToken}` },
      },
    );
    const data = response.data;
    return data.data;
  }
}
