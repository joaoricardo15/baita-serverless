# Baita Serverless

Backend application for BaitaHelp: the app that helps you to automate your life. This is a personal project that was inspired by Zapier's architecture, but aimed at normal people.

API available at: **https://api.baita.help**

At the end of the day, the baseline technologies implemented in this project are `Serverless Framework`, `Typescript`, `@aws-sdk`, `ajv`, `axios`.

## Project status

This project is currently in development.

## Key capabilities:

- REST API capabilities
- DynamoDB 
- Request authentication (Auth0)
- JSON schema validation (ajv)
- Safe and isolated code execution mechanism (vm)
- Oauth integrations with very popular and well established systems (so far, GMail, Pipedrive and OpenAI)
- Fully automated CI/CD (Github actions)
- Centralized error handling and logging (AWS CloudWatch)
- Custom domain https://api.baita.help (AWS Route53)
- Code linting and formatting (ESLint + prettier)

## Next improvements

- Add extra steps into CI/CD pipeline (lint + unit test + integration tests)

## Database

Storage uses DynamoDB on a single table design. Here are the data schemas:

PK     | SK                       | Definition
------ | ------------------------ | ----------
usedId | #USER                    | User
usedId | #TODO                    | Todo list
usedId | #BOT#botId               | Bot
usedId | #CONNECTION#connectionId | Connection
usedId | #CONTENT#contentId       | Content

## Main endpoints:

Method | URL
------ | ---
POST   | /dev/user
GET    | /user/{userId}/content
GET    | /user/{userId}/connections
GET    | /user/{userId}/bots
GET    | /user/{userId}/bots/{botId}
POST   | /user/{userId}/bots
PUT    | /user/{userId}/bots/{botId}
DELETE | /user/{userId}/bots/{botId}/api/{apiId}
POST   | /user/{userId}/bots/{botId}/deploy
POST   | /user/{userId}/bots/{botId}/test/{taskIndex}
GET    | /user/{userId}/bots/{botId}/logs
GET    | /connectors/pipedrive
GET    | /connectors/google

## Installation and Setup Instructions

Clone down this repository. You will need `node` and `npm` installed globally on your machine.

Installation:

`npm install`

To Run Test Suite:

`npm test`

To Start Server:

`npm start`

To Access Api:

`localhost:5000/dev`

To Run Code linting:

`npm lint`

To Run Code formatting:

`npm format`