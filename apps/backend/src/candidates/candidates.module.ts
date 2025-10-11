import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { CandidatesController } from './candidates.controller';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiService } from '../openai/openai.service';
import { FileParsingService } from '../file-parsing/file-parsing.service';

@Module({
  controllers: [CandidatesController],
  providers: [
    CandidatesService,
    PrismaService,
    OpenAiService,
    FileParsingService,
  ],
  exports: [CandidatesService],
})
export class CandidatesModule {}
