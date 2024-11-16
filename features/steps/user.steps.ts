import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios from 'axios';
import { CustomWorld } from '../bootstrap/world';

function generateRandomPassword(length: number = 12): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

When(
  'I create a user with name {string}, email {string}, and username {string}',
  async function (
    this: CustomWorld,
    name: string,
    email: string,
    username: string,
  ) {
    if (!this.isAuthenticatedAdmin) {
      throw new Error('User is not authenticated as an admin');
    }

    try {
      const password = generateRandomPassword();

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
            name: name,
            email: email,
            username: username,
            password: password,
          },
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors during user creation:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      if (!response.data.data.createUser) {
        console.error(
          'No data returned for createUser:',
          JSON.stringify(response.data, null, 2),
        );
        throw new Error('createUser mutation returned null');
      }

      this.createdUser = response.data.data.createUser;
      this.users.push(this.createdUser);
      this.createdUser.password = password;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },
);

Then(
  'the user {string} should be created successfully',
  async function (this: CustomWorld, userName: string) {
    try {
      expect(this.createdUser).to.exist;
      expect(this.createdUser.id).to.exist;
      expect(this.createdUser.name).to.equal(userName);
      expect(this.createdUser.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(this.createdUser.username).to.equal(
        userName.replace(/\s+/g, '').toLowerCase(),
      );
      expect(this.createdUser.password).to.exist;
    } catch (error: any) {
      console.error('Error in Then step:', error.message, error.stack);
      throw error;
    }
  },
);
