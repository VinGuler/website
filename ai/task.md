## Goal

Re-structure the repo and introduce a new tool - Turborepo.

## Definition of Done

### Resturecure

These 2 folders at root:

- "packages" for shared tools, componenets and utilities
- "apps" for deployable applications, can be api-app, client-app, fullstack app, server-process etc.

### Turborepo

Turborepo is integrated into the repositories infrastructure

### Everything works

All scripts [`dev`, `build`, `test`, `lint`] work for all apps, both from the root (use `<script>:<app-name>` or `<script>:<package-name>`)

## Notes

- All content currently in `packages` is apps -> move them all to the new `apps` folder.
- create a `utils` package in `packages`, with a simple log function. import it into all the apps to show POC.

## AI Definitions

- For this task, you are a Senior Developer, fluent with monorrepos infrastructure and usage.
- For this task, you are allowed to run all scripts within this project folder `website`
- Create a `progress.md` where you document milestones and processes. Update after each milestone is achieved.
- For this task - You don't ask questions - you run till completion - you can do this without me.
- Currently, ignore the features folder under `ai` - these will change
