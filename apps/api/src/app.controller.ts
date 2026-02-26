import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('docs')
  getDocs() {
    return this.appService.getDocsList();
  }

  @Get('doc')
  getDoc(@Query('filename') filename: string) {
    return this.appService.getDocContent(filename);
  }

  @Post('plantuml')
  renderPlantUml(@Body() body: { code: string }) {
    return this.appService.renderPlantUml(body.code);
  }
}
