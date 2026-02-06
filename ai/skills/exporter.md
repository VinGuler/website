# Skill: Exporter

## Purpose

The Exporter skill is designed to "flatten" a specific application from the `workspace` monorepo into a standalone repository. This process extracts the chosen application along with its relevant internal `@workspace` dependencies, making it ready for independent deployment, sharing, or use as a "home assignment."

## How it Works (High-Level)

The skill utilizes `pnpm deploy` or a similar mechanism to:

1.  Identify the target application within the `/apps` directory.
2.  Gather all internal `@workspace` dependencies used by the application.
3.  Copy the application's source code and its bundled dependencies to a new, isolated directory.
4.  Generate a clean `package.json` file in the new directory, replacing `workspace:` protocol dependencies with concrete versions.
5.  Initialize a fresh Git history in the new standalone repository.
6.  Generate a `docker-compose.yml` file pre-configured for local Postgres provisioning, enabling a "clone-and-run" experience for third parties.

## Inputs

- **`appName`**: The name of the application to export (e.g., `client-server-database`). This corresponds to a directory within `/apps`.
- **`outputPath`**: (Optional) The target directory where the standalone repository should be created. Defaults to a temporary location or a predefined `exports/` directory.

## Outputs

- A new, self-contained Git repository at the specified `outputPath` (or default location).
- The repository contains:
  - The exported application's source code.
  - All necessary bundled dependencies.
  - A `package.json` with resolved dependencies.
  - A clean Git history.
  - A `docker-compose.yml` for local database setup (if applicable).

## Usage Example

`gemini-cli skill run exporter --appName=client-server-database --outputPath=/tmp/exported-app`
(Note: Actual command structure will depend on the skill implementation.)

## Notes

- The exported repository is intended to be fully functional and independent of the original monorepo.
- It provides a streamlined way to share individual projects without exposing the entire monorepo structure.
