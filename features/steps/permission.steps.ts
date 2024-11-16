import { Given, When, Then } from '@cucumber/cucumber';

Given(
  'I have a tweet with content {string} by user {string}',
  async function (tweetContent: string, userName: string) {
    const user = await this.findUserByName(userName);
    if (!user) {
      throw new Error(`User with name ${userName} not found`);
    }

    try {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
        mutation CreateTweet($input: CreateTweetInput!) {
          createTweet(input: $input) {
            id
            content
          }
        }
      `,
        variables: {
          input: { content: tweetContent, authorId: user.id },
        },
      });

      if (response.data.errors) {
        throw new Error(
          `Failed to create tweet: ${response.data.errors[0].message}`,
        );
      }

      if (!response.data.data.createTweet) {
        throw new Error('Tweet creation failed');
      }

      this.currentTweet = response.data.data.createTweet;
    } catch (error: any) {
      console.error('Error creating tweet:', error.message);
      throw error;
    }
  },
);

Given(
  'I have a tweet with content {string} by user {string} with edit permissions granted to {string}',
  async function (
    tweetContent: string,
    authorName: string,
    granteeName: string,
  ) {
    const author = await this.findUserByName(authorName);
    const grantee = await this.findUserByName(granteeName);

    if (!author || !grantee) {
      throw new Error(`Author or Grantee does not exist`);
    }

    try {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
        mutation CreateTweet($input: CreateTweetInput!) {
          createTweet(input: $input) {
            id
            content
          }
        }
      `,
        variables: {
          input: { content: tweetContent, authorId: author.id },
        },
      });

      if (response.data.errors) {
        throw new Error(
          `Failed to create tweet: ${response.data.errors[0].message}`,
        );
      }

      const tweet = response.data.data.createTweet;
      if (!tweet) {
        throw new Error('Tweet creation failed');
      }

      this.currentTweet = tweet;

      const permissionResponse = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
        mutation GrantEditPermission($input: GrantEditPermissionInput!) {
          grantEditPermission(input: $input) {
            success
          }
        }
      `,
        variables: {
          input: { tweetId: tweet.id, userId: grantee.id },
        },
      });

      if (permissionResponse.data.errors) {
        throw new Error(
          `Failed to grant edit permission: ${permissionResponse.data.errors[0].message}`,
        );
      }
    } catch (error: any) {
      console.error('Error in given step:', error.message);
      throw error;
    }
  },
);

When(
  'I revoke edit permission from user {string} for the tweet {string}',
  async function (userName: string, tweetContent: string) {
    const user = await this.findUserByName(userName);
    const tweet = await this.findTweetByContent(tweetContent);
    if (!user || !tweet) {
      throw new Error(`User or Tweet does not exist`);
    }

    try {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
        mutation RevokeEditPermission($tweetId: String!, $userId: String!) {
          revokeEditPermission(tweetId: $tweetId, userId: $userId)
        }
      `,
        variables: {
          tweetId: tweet.id,
          userId: user.id,
        },
      });

      if (response.data.errors) {
        throw new Error(
          `Failed to revoke edit permission: ${response.data.errors[0].message}`,
        );
      }
    } catch (error: any) {
      console.error('Error revoking permission:', error.message);
      throw error;
    }
  },
);

Then(
  'user {string} should not have edit permissions for the tweet {string}',
  async function (userName: string, tweetContent: string) {
    const user = await this.findUserByName(userName);
    const tweet = await this.findTweetByContent(tweetContent);
    if (!user || !tweet) {
      throw new Error(`User or Tweet does not exist`);
    }

    try {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
        query GetTweetPermissions($tweetId: String!) {
          tweetPermissions(tweetId: $tweetId) {
            userId
            canEdit
          }
        }
      `,
        variables: {
          tweetId: tweet.id,
        },
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const permissions = response.data.data.tweetPermissions;
      const permission = permissions.find(
        (perm: any) => perm.userId === user.id,
      );

      if (permission && permission.canEdit) {
        throw new Error(
          `User ${userName} still has edit permissions for tweet ${tweetContent}`,
        );
      }
    } catch (error: any) {
      console.error('Error verifying permission:', error.message);
      throw error;
    }
  },
);

When(
  'I grant edit permission to user {string} for the tweet {string}',
  async function (userName: string, tweetContent: string) {
    const user = await this.findUserByName(userName);

    const tweet = await this.findTweetByContent(tweetContent);

    if (!user || !tweet) {
      throw new Error(`User or Tweet does not exist`);
    }

    const response = await this.httpClient.post('', {
      query: `
        mutation UpdateTweetPermissions($input: UpdateTweetPermissionsInput!) {
          updateTweetPermissions(input: $input)
        }
      `,
      variables: {
        input: {
          tweetId: tweet.id,
          editPermissions: [user.id],
          inheritEditPermissions: false,
          inheritViewPermissions: false,
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
  },
);

Then(
  'user {string} should have edit permissions for the tweet {string}',
  async function (userName: string, tweetContent: string) {
    const user = await this.findUserByName(userName);
    const tweet = await this.findTweetByContent(tweetContent);
    if (!user || !tweet) {
      throw new Error(`User or Tweet does not exist`);
    }

    try {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
        query GetTweetPermissions($tweetId: String!) {
          tweetPermissions(tweetId: $tweetId) {
            userId
            canEdit
          }
        }
      `,
        variables: {
          tweetId: tweet.id,
        },
      });

      if (response.data.errors) {
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const permissions = response.data.data.tweetPermissions;
      const permission = permissions.find(
        (perm: any) => perm.userId === user.id,
      );

      if (!permission || !permission.canEdit) {
        throw new Error(
          `User ${userName} does not have edit permissions for tweet ${tweetContent}`,
        );
      }
    } catch (error: any) {
      console.error('Error verifying permission:', error.message);
      throw error;
    }
  },
);
