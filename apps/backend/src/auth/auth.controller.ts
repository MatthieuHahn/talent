import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { LocalAuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    try {
      return await this.authService.register(registerDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Registration failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body(ValidationPipe) loginDto: LoginDto) {
    return this.authService.login(req.user);
  }
}
