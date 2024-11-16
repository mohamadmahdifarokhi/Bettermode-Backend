import { createConnection, Connection } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { Group } from '../../src/groups/entities/group.entity';
import { Tweet } from '../../src/tweets/entities/tweet.entity';
import { Permission } from '../../src/permissions/entities/permission.entity';
import { Message } from '../../src/messaging/entities/message.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

let connection: Connection | null = null;

export const db = {
  async init() {
    if (!connection) {
      connection = await createConnection({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE || 'bettermodetest',
        entities: [User, Group, Tweet, Permission, Message],
        synchronize: true,

        logging: true,
        logger: 'advanced-console',
      });
    }
  },

  async close() {
    if (connection) {
      await connection.close();
      connection = null;
    }
  },

  async clearTestData() {
    if (connection) {
      const entities = connection.entityMetadatas;

      try {
        const messageRepository = connection.getRepository(Message);
        await messageRepository.query(
          `DELETE FROM "message" 
           WHERE "senderId" IN (SELECT "id" FROM "users" WHERE "isAdmin" = false)
           OR "receiverId" IN (SELECT "id" FROM "users" WHERE "isAdmin" = false);`,
        );

        for (const entity of entities) {
          const repository = connection.getRepository(entity.name);
          if (entity.name !== 'User') {
            await repository.query(
              `TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
            );
          }
        }

        const userRepository = connection.getRepository(User);
        await userRepository.delete({ isAdmin: false });
      } catch (error) {
        console.error('Error while clearing test data:', error);
        throw error;
      }
    }
  },
};
