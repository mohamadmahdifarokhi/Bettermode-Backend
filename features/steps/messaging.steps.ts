import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { CustomWorld } from '../bootstrap/world';
import axios from 'axios';

Given(
  'user {string} has sent messages to user {string}',
  async function (this: CustomWorld, senderName: string, receiverName: string) {
    const sender = await this.findUserByName(senderName);
    const receiver = await this.findUserByName(receiverName);
    if (!sender || !receiver) {
      throw new Error(
        `Sender "${senderName}" or Receiver "${receiverName}" does not exist`,
      );
    }
    try {
      const messages = [
        { content: 'Hello!', senderId: sender.id, receiverId: receiver.id },
        {
          content: 'How are you?',
          senderId: sender.id,
          receiverId: receiver.id,
        },
      ];

      for (const msg of messages) {
        const response = await this.httpClient.post('', {
          query: `
            mutation SendMessage($input: SendMessageInput!) {
              sendMessage(input: $input) {
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
            input: msg,
          },
        });

        if (response.data.errors) {
          console.error(
            'GraphQL Errors:',
            JSON.stringify(response.data.errors, null, 2),
          );
          throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
        }

        this.sentMessages = this.sentMessages || [];
        this.sentMessages.push(response.data.data.sendMessage);
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to send messages: ${error.message}`);
    }
  },
);

When(
  'user {string} sends a message {string} to user {string}',
  async function (
    this: CustomWorld,
    senderName: string,
    messageContent: string,
    receiverName: string,
  ) {
    const sender = await this.findUserByName(senderName);
    const receiver = await this.findUserByName(receiverName);
    if (!sender || !receiver) {
      throw new Error(
        `Sender "${senderName}" or Receiver "${receiverName}" does not exist`,
      );
    }

    try {
      await this.authenticateUser(senderName);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to authenticate user "${senderName}": ${error.message}`,
        );
      } else {
        throw new Error(
          `Failed to authenticate user "${senderName}": Unknown error occurred`,
        );
      }
    }

    try {
      const response = await this.httpClient.post('', {
        query: `
          mutation SendMessage($input: SendMessageInput!) {
            sendMessage(input: $input) {
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
          input: {
            content: messageContent,
            senderId: sender.id,
            receiverId: receiver.id,
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

      this.currentMessage = response.data.data.sendMessage;
      this.sentMessages.push(this.currentMessage);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to send message: ${error.message}`);
    }
  },
);

Then(
  'user {string} should receive the message {string} from user {string}',
  async function (
    this: CustomWorld,
    receiverName: string,
    messageContent: string,
    senderName: string,
  ) {
    const receiver = await this.findUserByName(receiverName);
    const sender = await this.findUserByName(senderName);

    if (!receiver || !sender) {
      throw new Error(
        `Sender "${senderName}" or Receiver "${receiverName}" does not exist`,
      );
    }

    try {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
          query GetMessages($receiverId: String!) {
            getMessages(receiverId: $receiverId) {
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
          receiverId: receiver.id,
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const messages = response.data.data.getMessages;
      const message = messages.find(
        (msg: any) =>
          msg.content === messageContent && msg.sender.name === senderName,
      );

      if (!message) {
        console.error(
          `Messages retrieved did not include the expected message from "${senderName}" to "${receiverName}" with content "${messageContent}".`,
          `Retrieved messages: ${JSON.stringify(messages, null, 2)}`,
        );
        throw new Error(
          `Message from ${senderName} to ${receiverName} with content "${messageContent}" was not found`,
        );
      }

      expect(message.content).to.equal(messageContent);
      expect(message.sender.name).to.equal(senderName);
      expect(message.receiver.name).to.equal(receiverName);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to verify message receipt: ${error.message}`);
    }
  },
);

When(
  'user {string} retrieves their messages',
  async function (this: CustomWorld, receiverName: string) {
    const receiver = await this.findUserByName(receiverName);
    if (!receiver) {
      throw new Error(`User "${receiverName}" does not exist`);
    }

    try {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
          query GetMessages($receiverId: String!) {
            getMessages(receiverId: $receiverId) {
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
          receiverId: receiver.id,
        },
      });

      if (response.data.errors) {
        console.error(
          'GraphQL Errors:',
          JSON.stringify(response.data.errors, null, 2),
        );
        throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
      }

      const messages = response.data.data.getMessages;
      if (!messages || messages.length === 0) {
        throw new Error('No messages retrieved');
      }

      this.retrievedMessages = messages;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Axios Error Response:',
          JSON.stringify(error.response?.data, null, 2),
        );
      }
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
  },
);

Then(
  'user {string} should see all messages sent by user {string}',
  async function (this: CustomWorld, receiverName: string, senderName: string) {
    const receiver = await this.findUserByName(receiverName);
    const sender = await this.findUserByName(senderName);
    if (!receiver || !sender) {
      throw new Error(
        `Sender "${senderName}" or Receiver "${receiverName}" does not exist`,
      );
    }

    try {
      const messages = this.retrievedMessages;
      const filteredMessages = messages.filter(
        (msg: any) => msg.sender.id === sender.id,
      );

      expect(filteredMessages).to.have.lengthOf.at.least(1);
      filteredMessages.forEach((msg: any) => {
        expect(msg.content).to.be.a('string');
        expect(msg.sender.name).to.equal(senderName);
        expect(msg.receiver.name).to.equal(receiverName);
      });
    } catch (error: any) {
      console.error('Error in Then step:', error);
      throw error;
    }
  },
);
