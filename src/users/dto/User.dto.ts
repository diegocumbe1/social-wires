import { IsString, IsNotEmpty, IsEmail, Length } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateUserDto {
  id?: string;

  @IsEmail()
  email: string;

  @Length(6, 20)
  password: string;

  userName: string;

  name: string;

  lastName: string;

  resetPasswordToken?: string;
}

export class RequestResetPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsNotEmpty()
  resetPasswordToken: string;

  @IsNotEmpty()
  @Length(6, 20)
  password: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
