# Baita Serverless

Backend application for BaitaHelp: the app that helps you to automate your life. This is a personal project that was inspired by standard workflow automation tools, but aimed at normal people.

API docs available at: **https://api.baita.help**

At the end of the day, the baseline technologies implemented in this project are `Serverless Framework`, `Typescript`, `@aws-sdk`, `ajv`, `axios`.

## Project status

This project is currently in development.

## Key capabilities:

- REST API capabilities
- Data storage (DynamoDB)
- JSON schema validation (ajv)
- Request authentication (Auth0)
- Fully automated CI/CD (Github actions)
- Safe and isolated code execution mechanism (vm)
- Oauth integrations with very popular and well established systems (so far, GMail, Pipedrive and OpenAI)
- Centralized error handling and logging (AWS CloudWatch)
- Custom domain https://api.baita.help (AWS Route53)
- Code linting and formatting (ESLint + prettier)
- Unit tests (Jest)

## Next improvements

- Add extra steps into CI/CD pipeline (lint + unit test + integration tests)

## Database

Storage uses DynamoDB on a single table design. Here are the data schemas:

PK     | SK                             | Definition
------ | ------------------------------ | ----------
usedId | #USER                          | User
usedId | #BOT#{botId}                   | Bot
usedId | #{resourceName}#{resourceName} | Generic resource
usedId | #CONTENT#{contentId}           | Content
usedId | #CONNECTION#{connectionId}     | Connection

## Installation and Setup Instructions

Clone down this repository. You will need `node` and `npm` installed globally on your machine.

Installation:

`npm install`

To Run Test Suite (Jest):

`npm test`

To Start Server:

`npm start`

To Access Api:

`localhost:5000/dev`

To Run Code linting (ESlint):

`npm lint`

To Run Code formatting (Prettier):

`npm format`