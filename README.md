You can add the Postman collection link to the `README` as follows:

---

# Bettermode Backend Application

## Tech Stack

- **Language**: TypeScript
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **API**: GraphQL
- **Messaging**: RabbitMQ
- **Search Engine**: Elasticsearch
- **Authentication**: JWT (for user management)
- **Testing**: Cucumber, Jest
- **Deployment**: Docker

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Docker & Docker Compose
- Git

### Installation

#### Clone the Repository

```bash
git clone https://github.com/yourusername/bettermode-backend.git
cd bettermode-backend
```

#### Environment Configuration

Create a `.env` file based on `.env.development`:

```bash
cp .env.development .env
```

#### Docker Setup

Ensure Docker is running and then execute:

```bash
docker-compose up -d
```

This will set up PostgreSQL, RabbitMQ, and Elasticsearch.

#### Install Dependencies

```bash
npm install
```

#### Start the Application

```bash
npm run http
```

#### Access GraphQL Playground

Navigate to [http://localhost:3010/graphql](http://localhost:3000/graphql) to interact with the API.

### Running End-to-End Tests

Run the e2e tests with Cucumber:

```bash
npm run test:e2e
```

### Running Consumers

Run the consumer services:

```bash
npm run consumer
```

## Postman Collection

You can import the following Postman collection to test the GraphQL endpoints:

[Bettermode Backend API Postman Collection](https://api.postman.com/collections/29682101-e70f6592-0536-46fa-93f2-ccf368b6fe49?access_key=PMAT-01JCV31XQM89XBMWHBHXPFD4JK)

---

## Project Design Considerations

In this project, various aspects of previous development experiences have been implemented to create a robust and scalable system.

- The **permission system** is designed so that each tweet inherits permissions from its parent tweet, ensuring efficient access control and avoiding redundant permission updates for child tweets during parent modifications.
- A **producer-consumer pattern** has been used in areas like permission updates and Elasticsearch indexing, leveraging experiences from microservice-based projects.
- End-to-end tests using **Cucumber** validate the correctness of all endpoints and their behavior, supporting behavior-driven development.
- A basic **authentication system** using JWT was implemented to demonstrate user authentication capabilities.

---
