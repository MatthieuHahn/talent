import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly s3: S3Client;
  private readonly endpoint: string;
  private readonly publicUrl: string;

  constructor() {
    this.endpoint = process.env.S3_ENDPOINT || 'http://localhost:9000';
    this.publicUrl = process.env.S3_PUBLIC_URL || this.endpoint;
    this.s3 = new S3Client({
      region: 'us-east-1',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true,
    });
  }

  async uploadFile({
    bucket,
    key,
    body,
    contentType,
  }: {
    bucket: string;
    key: string;
    body: Buffer | Uint8Array | Blob | string;
    contentType?: string;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.s3.send(command);
    return `${this.publicUrl}/${bucket}/${key}`;
  }

  async getFile({ bucket, key }: { bucket: string; key: string }) {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return this.s3.send(command);
  }

  async deleteFile({ bucket, key }: { bucket: string; key: string }) {
    const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    return this.s3.send(command);
  }

  async getSignedUrl({
    bucket,
    key,
    expiresIn = 60,
  }: {
    bucket: string;
    key: string;
    expiresIn?: number;
  }): Promise<string> {
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.s3, command, { expiresIn });
  }
}
