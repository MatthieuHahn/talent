import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');

@Injectable()
export class FileParsingService {
  private readonly logger = new Logger(FileParsingService.name);

  async parseResumeFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type. Please upload a PDF or DOCX file.',
      );
    }

    try {
      let text: string;

      if (file.mimetype === 'application/pdf') {
        text = await this.parsePDF(file.buffer);
      } else if (
        file.mimetype ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/msword'
      ) {
        text = await this.parseDOCX(file.buffer);
      } else {
        throw new BadRequestException('Unsupported file type');
      }

      // Clean up the extracted text
      return this.cleanExtractedText(text);
    } catch (error) {
      this.logger.error('Error parsing resume file:', error);
      throw new BadRequestException('Failed to parse resume file');
    }
  }

  private async parsePDF(buffer: Buffer): Promise<string> {
    try {
      // Use pdf-parse with options to prevent worker issues
      const options = {
        // Disable worker to avoid URL issues
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      };

      const data = await pdfParse(buffer, options);
      return data.text;
    } catch (error) {
      this.logger.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  private async parseDOCX(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error('Error parsing DOCX:', error);
      throw new Error('Failed to parse DOCX file');
    }
  }

  private cleanExtractedText(text: string): string {
    return (
      text
        // Remove extra whitespace and normalize line breaks
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        // Remove common PDF artifacts
        .replace(/[^\x20-\x7E\n]/g, '')
        // Trim and ensure we have clean text
        .trim()
    );
  }

  validateFileSize(file: Express.Multer.File, maxSizeInMB: number = 10): void {
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      throw new BadRequestException(`File size exceeds ${maxSizeInMB}MB limit`);
    }
  }

  getFileInfo(file: Express.Multer.File): {
    filename: string;
    mimetype: string;
    size: number;
    sizeInMB: number;
  } {
    return {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      sizeInMB: Math.round((file.size / (1024 * 1024)) * 100) / 100,
    };
  }
}
