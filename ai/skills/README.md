# AI Skills

This directory is intended to house definitions and documentation for various "skills" that an AI agent can utilize. These skills represent executable scripts or command-line tools designed to automate complex tasks within the `workspace` monorepo.

## Purpose

Skills enable the AI agent to perform sophisticated operations, such as scaffolding new projects, extracting standalone applications, or performing codebase refactorings, by providing structured inputs and expected outputs for these automated processes.

## Key Skills (Planned/Implemented)

- **Exporter**: A skill to "flatten" an application from the monorepo into a standalone repository, bundling its internal dependencies and preparing it for independent deployment or sharing (e.g., as a home assignment).
- **Scaffolder**: A skill designed to generate new projects within the `/apps` directory based on the "Gold Master" templates located in `/templates`. It handles copying the template and initial configuration.

## How to Document a Skill

Each skill should ideally have its own Markdown file detailing:

- **Purpose**: What the skill does and why it's useful.
- **Inputs**: Any parameters, arguments, or configurations the skill requires.
- **Outputs**: What the skill produces (e.g., files, console output, modifications to the codebase).
- **Usage**: Examples of how to invoke the skill.
- **Implementation Details**: (Optional) High-level overview of the underlying script or tool.
