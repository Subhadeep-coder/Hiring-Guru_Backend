import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { AuthService } from 'src/user/auth/auth.service';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private usersService: AuthService) {
    super();
  }

  serializeUser(user: any, done: Function) {
    done(null, user.id);
  }

  async deserializeUser(userId: string, done: Function) {
    try {
      const user = await this.usersService.findById(userId);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}