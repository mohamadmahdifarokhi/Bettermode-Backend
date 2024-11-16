import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminUser = await usersService.findByUsername('admin');
  if (!adminUser) {
    await usersService.createUser({
      name: 'Admin',
      email: 'admin@example.com',
      username: 'admin',
      password: 'adminpassword',
      isAdmin: true,
    });
  } else {
  }

  await app.close();
}

bootstrap();
