# Task

## Prerequisites

I'm not sure I have a local Postgres server and tools installed on the machine (WSL2). Before starting, make sure you have everything up, running and accessible LOCALLY before starting this task.

## Requirements

Implement `@workspace/database` (Postgres).
It should contain a safe way to load the connection string (reading from `process.env`).
It should create a client for the apps to use, and provide API to use the db.
Connection string will be the same for all the apps, and should be held in a .env file in the `@workspace/database` package.
Each app, should have its own database following the apps name. so for `client-server-database` template the db name should be `client-server-database_db` (Formatted according to the best-practices of postgres).
Schemas should be implemented using Prisma per app, meaning not in the `@workspace/database` package.

## Goals

- Implement a package for database - providing a postgres db client, handling connection and providing basic API. If possible I'd this package to be the only one with postgres related dependencies, providing a facade layer over the database for the apps.
- Use this in `client-server-database` template. Currently it is a todo list app relying on memory - add database support instead, so it is implemented with a database instead of in-memory.

## DoD

`@workspace/database` is implemented and used in `client-server-database` template.
`client-server-database` template holds the Prisma schemas, if possible Prisma deps and Postgres deps only installed on `@workspace/database`.
Tests are added and passing for both the `@workspace/database` package and `client-server-database` template with high coverage.
Everything works locally.

## More details

- I want you to use this task to test our ai documentation. Try to use anything you can from the documentation, reading as less files as possible.
- Add skills - you're running tests? running format and lint? build? for each thing you need to check `package.json` file for - add a skill instead.
- Use Persona. create sub agents as the relevant persona and make sure they work together: the fs dev should plan and discuss concerns the the security expert, then implement and add tests, then qa should make sure this actually works and test coverage is high.

## Security

Any connection string or other auth details should never reach git, use the security expert persona to validate this task once done.
