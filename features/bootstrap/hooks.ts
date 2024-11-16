import { BeforeAll, AfterAll, After } from '@cucumber/cucumber';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import * as dotenv from 'dotenv';
import { db } from '../db/db';
import { UsersService } from '../../src/users/users.service';

dotenv.config({ path: '.env.test' });

let app: INestApplication;

BeforeAll(async function () {
  try {
    await db.init();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const usersService = app.get<UsersService>(UsersService);

    const adminUser = await usersService.findByUsername(
      process.env.ADMIN_USERNAME || 'admin',
    );

    if (!adminUser) {
      await usersService.createUser({
        name: 'Admin',
        email: 'admin@example.com',
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'adminpassword',
        isAdmin: true,
      });
    } else {
    }

    await app.listen(3011);
  } catch (error) {
    console.error('Error during BeforeAll hook:', error);
    throw error;
  }
});

AfterAll(async function () {
  try {
    if (app) {
      await app.close();
    }

    await db.close();
  } catch (error) {
    console.error('Error during AfterAll hook:', error);
    throw error;
  }
});

After(async function () {
  await db.clearTestData();
});
