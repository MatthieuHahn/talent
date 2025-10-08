import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';

export enum UserRole {
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  INTERVIEWER = 'INTERVIEWER',
}

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.RECRUITER;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
