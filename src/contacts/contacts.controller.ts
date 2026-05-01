import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto, ContactResponseDto } from './dto/contact.dto';
import { ApiWrappedOkResponse } from 'src/common/responses/swagger.decorators';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a contact' })
  @ApiWrappedOkResponse({ dataDto: ContactResponseDto, description: 'Created contact' })
  create(@Req() req: Request, @Body() dto: CreateContactDto): Promise<ContactResponseDto> {
    const orgId = (req as any).orgId;
    if (!orgId) throw new UnauthorizedException();
    return this.contactsService.create(orgId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all contacts for the current organisation' })
  @ApiWrappedOkResponse({ dataDto: ContactResponseDto, isArray: true, description: 'Contact list' })
  findAll(@Req() req: Request): Promise<ContactResponseDto[]> {
    const orgId = (req as any).orgId;
    if (!orgId) throw new UnauthorizedException();
    return this.contactsService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single contact by ID' })
  @ApiWrappedOkResponse({ dataDto: ContactResponseDto, description: 'Contact detail' })
  findOne(@Req() req: Request, @Param('id', ParseIntPipe) id: number): Promise<ContactResponseDto> {
    const orgId = (req as any).orgId;
    if (!orgId) throw new UnauthorizedException();
    return this.contactsService.findOne(orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a contact (name, email, opt-out, metadata)' })
  @ApiWrappedOkResponse({ dataDto: ContactResponseDto, description: 'Updated contact' })
  update(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContactDto,
  ): Promise<ContactResponseDto> {
    const orgId = (req as any).orgId;
    if (!orgId) throw new UnauthorizedException();
    return this.contactsService.update(orgId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a contact' })
  remove(@Req() req: Request, @Param('id', ParseIntPipe) id: number): Promise<void> {
    const orgId = (req as any).orgId;
    if (!orgId) throw new UnauthorizedException();
    return this.contactsService.remove(orgId, id);
  }
}
