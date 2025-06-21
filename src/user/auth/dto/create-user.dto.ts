import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  authProvider: string;

  @IsString()
  authProviderId: string;

  @IsOptional()
  @IsString()
  githubUsername?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

