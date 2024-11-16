import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'chai';
import { CustomWorld } from '../bootstrap/world';
import axios from 'axios';

Given(
  'I have a group named {string}',
  async function (this: CustomWorld, groupName: string) {
    let group = await this.findGroupByName(groupName);
    if (!group) {
      if (!this.isAuthenticatedAdmin) {
        throw new Error('Admin is not authenticated to create a group');
      }

      try {
        const response = await this.httpClient.post('', {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
          query: `
            mutation CreateGroup($input: CreateGroupInput!) {
              createGroup(input: $input) {
                id
                name
                description
                members {
                  id
                  name
                }
                owner {
                  id
                  name
                }
              }
            }
          `,
          variables: {
            input: {
              name: groupName,
              description: `${groupName} description`,
              userIds: [],
              ownerId: '',
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

        group = response.data.data.createGroup;
        this.groups.push(group);
      } catch (error: any) {
        if (axios.isAxiosError(error)) {
          console.error(
            'Axios Error Response:',
            JSON.stringify(error.response?.data, null, 2),
          );
        }
        throw new Error(
          `Failed to create group "${groupName}": ${error.message}`,
        );
      }
    }
    expect(group).to.exist;
  },
);

When(
  'I create a group with name {string} and description {string}',
  async function (this: CustomWorld, groupName: string, description: string) {
    try {
      const user = await this.findUserByName('John Doe');
      if (!user) {
        throw new Error('User "John Doe" not found');
      }

      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
          mutation CreateGroup($input: CreateGroupInput!) {
            createGroup(input: $input) {
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
        variables: {
          input: {
            name: groupName,
            description: description,
            userIds: [user.id],
            ownerId: user.id,
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

      this.createdGroup = response.data.data.createGroup;
      this.groups.push(this.createdGroup);
    } catch (error: any) {
      console.error(`Failed to create group: ${error}`);
      throw new Error(`Failed to create group: ${error.message}`);
    }
  },
);

Then(
  'the group {string} should be created successfully',
  async function (this: CustomWorld, groupName: string) {
    try {
      expect(this.createdGroup).to.exist;
      expect(this.createdGroup.name).to.equal(groupName);

      if (
        this.createdGroup.description !== null &&
        this.createdGroup.description !== undefined
      ) {
        expect(this.createdGroup.description).to.be.a('string');
      } else {
        expect(this.createdGroup.description).to.be.null;
      }

      expect(this.createdGroup.members).to.be.an('array').that.is.not.empty;
    } catch (error: any) {
      console.error('Error in Then step:', error);
      throw error;
    }
  },
);

When(
  'I add user {string} to group {string}',
  async function (this: CustomWorld, userName: string, groupName: string) {
    const user = await this.findUserByName(userName);
    const group = await this.findGroupByName(groupName);

    if (!user || !group) {
      throw new Error(
        `User "${userName}" or Group "${groupName}" does not exist`,
      );
    }

    if (group.members.some((member: any) => member.id === user.id)) {
      throw new Error(
        `User "${userName}" is already a member of the group "${groupName}".`,
      );
    }

    try {
      const response = await this.httpClient.post('', {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
        query: `
          mutation AddUserToGroup($input: AddUserToGroupInput!) {
            addUserToGroup(input: $input) {
              id
              name
              members {
                id
                name
              }
            }
          }
        `,
        variables: {
          input: {
            userId: user.id,
            groupId: group.id,
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

      const updatedGroup = response.data.data.addUserToGroup;
      const groupIndex = this.groups.findIndex((g: any) => g.id === group.id);
      if (groupIndex !== -1) {
        this.groups[groupIndex] = updatedGroup;
      }
    } catch (error: any) {
      console.error(
        `Failed to add user "${userName}" to group "${groupName}": ${error.message}`,
      );
      throw new Error(`Failed to add user to group: ${error.message}`);
    }
  },
);

Then(
  'user {string} should be a member of group {string}',
  async function (this: CustomWorld, userName: string, groupName: string) {
    try {
      const group = await this.findGroupByName(groupName);
      const user = await this.findUserByName(userName);

      if (!group || !user) {
        throw new Error(
          `User "${userName}" or Group "${groupName}" does not exist`,
        );
      }

      const isMember =
        group.members &&
        group.members.some((member: any) => member.id === user.id);
      expect(isMember).to.be.true;
    } catch (error: any) {
      console.error('Error in Then step:', error);
      throw error;
    }
  },
);
