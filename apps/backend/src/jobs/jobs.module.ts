import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenAiModule } from '../openai/openai.module';
import { FileParsingService } from '../file-parsing/file-parsing.service';

@Module({
  imports: [PrismaModule, OpenAiModule],
  controllers: [JobsController],
  providers: [JobsService, FileParsingService],
  exports: [JobsService],
})
export class JobsModule {}
