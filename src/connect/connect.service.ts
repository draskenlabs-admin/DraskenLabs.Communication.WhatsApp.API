import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UserWhatsappService } from 'src/user/user-whatsapp.service';
import { WabaService } from 'src/waba/waba.service';
import { WabaPhoneNumberService } from 'src/waba-phone-number/waba-phone-number.service';
import { ConnectWhatsAppRequestDTO, ConnectWhatsAppResponseDTO } from './dto/connect-waba.dto';

@Injectable()
export class ConnectService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userWhatsappService: UserWhatsappService,
    private readonly wabaService: WabaService,
    private readonly wabaPhoneNumberService: WabaPhoneNumberService,
  ) {}

  async connectWhatsapp(
    body: ConnectWhatsAppRequestDTO,
    userId: number,
    ssoOrgId: string,
  ): Promise<ConnectWhatsAppResponseDTO> {
    // 1. Exchange the Meta OAuth code for an access token
    const tokenRes = await axios.get(
      'https://graph.facebook.com/v25.0/oauth/access_token',
      {
        params: {
          client_id: this.configService.get('META_APP_ID') ?? '',
          client_secret: this.configService.get('META_APP_SECRET') ?? '',
          code: body.code,
        },
      },
    );
    const rawAccessToken: string = tokenRes.data.access_token;
    if (!rawAccessToken) throw new BadRequestException('Failed to exchange code for access token');

    // 2. Fetch WABA metadata from Meta
    const wabaRes = await axios.get(
      `https://graph.facebook.com/v25.0/${body.wabaId}`,
      {
        params: { fields: 'id,name,currency,timezone_id,message_template_namespace' },
        headers: { Authorization: `Bearer ${rawAccessToken}` },
      },
    );
    const wabaMeta = wabaRes.data;

    // 3. Upsert Waba record with metadata
    await this.wabaService.createOrUpdateWaba({
      wabaId: body.wabaId,
      userId,
      ssoOrgId,
      name: wabaMeta.name,
      currency: wabaMeta.currency,
      timezoneId: wabaMeta.timezone_id?.toString(),
      messageTemplateNamespace: wabaMeta.message_template_namespace,
    });

    // 4. Store the connection — token is encrypted inside createOrUpdate
    const userWhatsapp = await this.userWhatsappService.createOrUpdate({
      userId,
      businessId: body.businessId,
      wabaId: body.wabaId,
      accessToken: rawAccessToken,
    });

    // 5. Sync phone numbers from Meta, populate Redis phone cache
    const phoneNumbers = await this.wabaPhoneNumberService.syncPhoneNumbersWithToken(
      userId,
      body.wabaId,
      rawAccessToken,
      userWhatsapp.accessToken, // already encrypted by createOrUpdate
    );

    return {
      wabaId: body.wabaId,
      businessId: body.businessId,
      phoneNumbers: phoneNumbers.map((p) => ({
        phoneNumberId: p.phoneNumberId,
        displayPhoneNumber: p.displayPhoneNumber,
        verifiedName: p.verifiedName,
      })),
    };
  }
}
