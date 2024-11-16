import { When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import axios from 'axios';

When(
  'I create a tweet with content {string} by user {string}',
  async function (content: string, userName: string) {
    const user = await this.findUserByName(userName);
    if (!user) {
      throw new Error(`User with name ${userName} does not exist`);
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
              author {
                id
                name
              }
            }
          }
        `,
        variables: {
          input: { content, authorId: user.id },
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      if (!response.data.data.createTweet) {
        console.error(
          'No data returned for createTweet:',
          JSON.stringify(response.data, null, 2),
        );
        throw new Error('createTweet mutation returned null');
      }

      this.currentTweet = response.data.data.createTweet;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to create tweet: ${error.message}`);
    }
  },
);

When(
  'I set view permissions for the tweet to include user {string}',
  async function (userName: string) {
    const user = await this.findUserByName(userName);
    const tweet = this.currentTweet;
    if (!user || !tweet) {
      throw new Error(`User or Tweet does not exist`);
    }
    try {
      const response = await this.httpClient.post('/graphql', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
          mutation SetViewPermissions($input: SetViewPermissionsInput!) {
            setViewPermissions(input: $input)
          }
        `,
        variables: {
          input: { tweetId: tweet.id, userIds: [user.id] },
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const success = response.data.data.setViewPermissions;
      expect(success).to.be.true;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to set view permissions: ${error.message}`);
    }
  },
);

Then(
  'the tweet {string} should be visible to user {string}',
  async function (tweetContent: string, userName: string) {
    const user = await this.findUserByName(userName);
    if (!user) {
      throw new Error(`User with name ${userName} does not exist`);
    }
    try {
      const response = await this.httpClient.post('/graphql', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
          query GetTweetsByUser($userId: String!) {
            tweetsByUser(userId: $userId) {
              id
              content
            }
          }
        `,
        variables: {
          userId: user.id,
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const tweets = response.data.data.tweetsByUser;
      const tweet = tweets.find((t: any) => t.content === tweetContent);
      if (!tweet) {
        throw new Error(
          `Tweet with content "${tweetContent}" not found for user "${userName}".`,
        );
      }

      expect(tweet.content).to.equal(tweetContent);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to verify tweet visibility: ${error.message}`);
    }
  },
);
