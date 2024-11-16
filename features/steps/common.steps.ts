import { Given } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios from 'axios';
import { CustomWorld } from '../bootstrap/world';

Given('I have an authenticated admin', async function (this: CustomWorld) {
  await this.authenticateAdmin();
});

Given('I have a user named {string}', async function (userName: string) {
  let user = await this.findUserByName(userName);
  if (!user) {
    try {
      const response = await this.httpClient.post('', {
        query: `
          mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              name
              email
              username
            }
          }
        `,
        variables: {
          input: {
            name: userName,
            email: `${userName.toLowerCase().replace(/\s+/g, '')}@example.com`,
            username: userName.toLowerCase().replace(/\s+/g, ''),
            password: 'defaultPassword123',
          },
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      this.createdUser = response.data.data.createUser;
      this.users.push(this.createdUser);
      user = this.createdUser;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }
  expect(user).to.exist;
});

Given(
  'I authenticate user {string}',
  async function (this: CustomWorld, userName: string) {
    try {
      await this.authenticateUser(userName);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to authenticate user "${userName}": ${error.message}`,
        );
      } else {
        throw new Error(
          `Failed to authenticate user "${userName}": Unknown error occurred`,
        );
      }
    }
  },
);
