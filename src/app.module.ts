import { Logger, Module, OnModuleInit, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TweetsModule } from './tweets/tweets.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MessagingModule } from './messaging/messaging.module';
import { SearchModule } from './search/search.module';
import * as Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validationSchema: Joi.object({
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        RABBITMQ_URI: Joi.string().uri().required(),
        ELASTICSEARCH_HOST: Joi.string().uri().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        dropSchema: false,
        logging: false,
      }),
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      debug: true,
    }),
    CommonModule,
    forwardRef(() => TweetsModule),
    UsersModule,
    GroupsModule,
    PermissionsModule,
    MessagingModule,
    SearchModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const rabbitMqUri = this.configService.get<string>('RABBITMQ_URI');
    const elasticsearchHost =
      this.configService.get<string>('ELASTICSEARCH_HOST');
    this.logger.log(`RABBITMQ_URI: ${rabbitMqUri}`);
    this.logger.log(`ELASTICSEARCH_HOST: ${elasticsearchHost}`);
  }
}
