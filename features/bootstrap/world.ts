import { setWorldConstructor, World } from '@cucumber/cucumber';
import axios, { AxiosInstance } from 'axios';

export class CustomWorld extends World {
  public httpClient: AxiosInstance;
  public createdUser: any;
  public createdGroup: any;
  public isAuthenticatedAdmin: boolean;
  public users: any[];
  public groups: any[];
  public authToken: string | null;
  private isTestDatabase: boolean;
  public sentMessages: any[];
  public retrievedMessages: any[];
  public currentTweet: any;
  public currentMessage: any;

  constructor(options: any) {
    super(options);
    this.httpClient = axios.create({
      baseURL: process.env.GRAPHQL_ENDPOINT || 'http://localhost:3011/graphql',
    });
    this.isAuthenticatedAdmin = false;
    this.users = [];
    this.groups = [];
    this.sentMessages = [];
    this.retrievedMessages = [];
    this.authToken = null;
    this.createdUser = null;
    this.createdGroup = null;
    this.currentTweet = null;
    this.currentMessage = null;
    this.isTestDatabase = process.env.NODE_ENV === 'test';

    this.httpClient.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );
  }

  public async findUserByName(name: string): Promise<any> {
    if (this.users.length === 0) {
      const response = await this.httpClient.post('', {
        query: `
          query {
            users {
              id
              name
              email
              username
            }
          }
        `,
      });
      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      this.users = response.data.data.users;
    }
    const user = this.users.find((user: any) => user.name === name);
    return user;
  }

  public async findGroupByName(name: string): Promise<any | undefined> {
    if (this.groups.length === 0) {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
          query GetGroupByName($name: String!) {
            group(name: $name) {
              id
              name
              description
              members {
                id
                name
              }
            }
          }
        `,
        variables: { name: name },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      if (response.data.data.group) {
        this.groups.push(response.data.data.group);
        return response.data.data.group;
      } else {
        return undefined;
      }
    }

    return this.groups.find((group: any) => group.name === name);
  }

  public async authenticateUser(userName: string): Promise<void> {
    try {
      const response = await this.httpClient.post('', {
        query: `
          mutation UserLogin($input: UserLoginInput!) {
            userLogin(input: $input) {
              token
            }
          }
        `,
        variables: {
          input: {
            username: userName,
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

      this.authToken = response.data.data.userLogin.token;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(
        `Failed to authenticate user "${userName}": ${error.message}`,
      );
    }
  }

  public async authenticateAdmin(): Promise<void> {
    if (this.isAuthenticatedAdmin) {
      return;
    }

    try {
      const response = await this.httpClient.post('', {
        query: `
          mutation AdminLogin($input: AdminLoginInput!) {
            adminLogin(input: $input) {
              token
            }
          }
        `,
        variables: {
          input: {
            username: process.env.ADMIN_USERNAME || 'admin',
            password: process.env.ADMIN_PASSWORD || 'adminpassword',
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

      this.authToken = response.data.data.adminLogin.token;
      this.isAuthenticatedAdmin = true;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to authenticate admin: ${error.message}`);
    }
  }

  public async cleanupEntities(): Promise<void> {
    if (this.isTestDatabase) {
      if (this.createdUser) {
        await this.deleteUser(this.createdUser.id);
        this.createdUser = null;
      }
      if (this.createdGroup) {
        await this.deleteGroup(this.createdGroup.id);
        this.createdGroup = null;
      }
      this.users = [];
      this.groups = [];
      this.sentMessages = [];
      this.retrievedMessages = [];
      this.currentTweet = null;
      this.currentMessage = null;
    }
  }

  private async deleteUser(userId: string): Promise<void> {
    try {
      await this.httpClient.post('', {
        query: `
          mutation DeleteUser($id: String!) {
            deleteUser(id: $id)
          }
        `,
        variables: { id: userId },
      });
    } catch (error: any) {
      console.error(`Failed to delete user ${userId}: ${error.message}`);
    }
  }

  private async deleteGroup(groupId: string): Promise<void> {
    try {
      await this.httpClient.post('', {
        query: `
          mutation DeleteGroup($id: String!) {
            deleteGroup(id: $id)
          }
        `,
        variables: { id: groupId },
      });
    } catch (error: any) {
      console.error(`Failed to delete group ${groupId}: ${error.message}`);
    }
  }

  public async findTweetByContent(content: string): Promise<any> {
    try {
      const response = await this.httpClient.post('', {
        query: `
          query GetTweetByContent($content: String!) {
            tweetsByContent(content: $content) {
              id
              content
              author {
                id
                name
              }
            }
          }
        `,
        variables: {
          content,
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const tweet = response.data.data.tweetsByContent?.[0];
      if (tweet) {
        return tweet;
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Error fetching tweet:', error.message);
      throw error;
    }
  }

  public async findMessageByContent(content: string): Promise<any> {
    try {
      const response = await this.httpClient.post('', {
        query: `
          query GetMessagesByContent($content: String!) {
            messagesByContent(content: $content) {
              id
              content
              sender {
                id
                name
              }
              receiver {
                id
                name
              }
            }
          }
        `,
        variables: {
          content,
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const message = response.data.data.messagesByContent?.[0];
      if (message) {
        return message;
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('Error fetching message:', error.message);
      throw error;
    }
  }
}

setWorldConstructor(CustomWorld);
