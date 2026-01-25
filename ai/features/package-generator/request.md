# Package Generator Application Overview

## Purpose

The **Package Generator** is an AI-powered local web application for creating new packages within the monorepo. It provides an interactive interface to:

- Generate new packages based on natural language descriptions of app ideas
- Scaffold projects using existing templates (client, server, or full-stack)
- Automatically integrate new packages into the monorepo infrastructure
- Ensure consistency with existing lint rules, testing setup, and coding standards
- Manage package-related scripts and configuration updates

This is **an AI-assisted development tool** that understands monorepo constraints and generates production-ready package scaffolds that follow established patterns.

---

## Core Features

### 1. AI-Powered Package Generation

- **Natural language interface**: Describe your app idea in plain English
- **Intent understanding**: AI determines the appropriate package type (client/server/full-stack)
- **Smart scaffolding**: Generates complete project structure based on existing examples
- **Constraint awareness**: Adheres to monorepo conventions, lint rules, and architectural patterns

### 2. Template-Based Architecture

- **Client template** (client-example):
  - Vue 3 + TypeScript + Vite
  - Pinia state management + Vue Router
  - Vitest for unit testing with jsdom
  - Component architecture with proper typing
- **Server template** (server-example):
  - Express 5 + TypeScript
  - RESTful API patterns
  - Vitest for API testing with supertest
  - Clean separation of concerns
- **Full-stack template** (full-stack-example):
  - Combined client/server in one package
  - Shared TypeScript configuration
  - Integrated build pipeline
  - Both frontend and backend testing

### 3. Automatic Monorepo Integration

- **Root package.json updates**:
  - Adds new workspace to workspaces array
  - Creates dev, build, and test scripts for the new package
  - Maintains naming conventions (e.g., `dev:package-name`, `build:package-name`)
- **Vitest configuration updates**:
  - Adds new test project to vitest.workspace.ts
  - Configures appropriate test environment (jsdom for client, node for server)
  - Sets up proper root directory and test patterns
- **ESLint configuration**:
  - Ensures new package follows existing lint rules
  - Applies appropriate parser settings based on package type
  - Respects Vue-specific rules for client packages
- **TypeScript configuration**:
  - Inherits from appropriate base configs
  - Sets correct module resolution and target settings
  - Configures proper paths and references

### 4. Intelligent Code Generation

- **Dependency management**:
  - Suggests relevant npm packages based on app requirements
  - Uses version ranges matching monorepo standards
  - Separates dependencies from devDependencies appropriately
- **File structure generation**:
  - Creates src directory with proper organization
  - Generates test files with basic test cases
  - Sets up configuration files (tsconfig, vite.config, etc.)
- **Boilerplate code**:
  - Implements basic functionality matching the app description
  - Follows existing code patterns and conventions
  - Includes TypeScript types and interfaces
  - Adds proper error handling and validation

### 5. Interactive Refinement

- **Clarification prompts**: AI asks questions when requirements are ambiguous
- **Feature selection**: User can specify which features to include/exclude
- **Customization options**: Adjust package name, description, dependencies
- **Preview before generation**: Review the planned structure before creation

---

## Technical Architecture

### Stack

- **Backend**: Express.js + TypeScript (agentic server)
- **Frontend**: HTML + TypeScript or lightweight Vue interface
- **AI Agent**: Claude SDK for intelligent code generation
- **Data Storage**: JSON files for configuration (local persistence)
- **Code Generation**: Template-based with AI-enhanced customization

### Key Services

1. **Intent Analyzer** - Parses user's app description and extracts requirements
2. **Package Type Classifier** - Determines if project should be client/server/full-stack
3. **Template Selector** - Chooses appropriate base template
4. **Code Generator** - Creates files using templates + AI customization
5. **Config Manager** - Updates root package.json, vitest config, eslint, etc.
6. **Dependency Resolver** - Determines required npm packages
7. **Validator** - Ensures generated code passes lint and type checks

### Agent Architecture

- **Agentic workflow**: Multi-step reasoning process for code generation
- **Context awareness**: Reads existing examples to understand patterns
- **Tool usage**: File system operations, code analysis, validation
- **Iterative refinement**: Can revise generated code based on validation results

### Integration Points

- **File system**: Read templates, write new packages
- **NPM**: Install dependencies for new packages
- **Git**: Stage new files (optional auto-commit)
- **Lint/Type checking**: Validate generated code before completion

---

## User Workflow

1. **Describe** - User enters natural language description of their app idea
2. **Clarify** - AI asks follow-up questions to understand requirements
3. **Preview** - Review proposed package structure, dependencies, and integration points
4. **Customize** - Adjust package name, features, or configuration
5. **Generate** - AI creates the package with all necessary files and configurations
6. **Integrate** - Automatic updates to root configs (package.json, vitest, etc.)
7. **Validate** - Run lint and type checks to ensure correctness
8. **Install** - Install dependencies via npm
9. **Test** - Run generated tests to verify basic functionality works

---

## Design Principles

- **Consistency**: Generated packages match existing monorepo patterns exactly
- **Intelligent**: Uses AI to understand intent and make smart scaffolding decisions
- **Compliant**: Automatically follows all lint rules, type constraints, and conventions
- **Complete**: Generates fully functional packages, not just empty scaffolds
- **Integrated**: Seamlessly connects new packages to monorepo infrastructure
- **Validated**: Ensures generated code passes all checks before completion
- **Transparent**: Shows all steps, files being created, and changes being made
- **Safe**: Validates constraints and prevents breaking changes to monorepo

---

## Example Interactions

### Example 1: Simple Client App

```
User: "Create a todo list app with Vue"

AI Analysis:
- Package type: client
- Template: client-example
- Features: Todo CRUD operations, local storage, Pinia store

Generated Package:
- packages/todo-app/
  - Vue 3 + TypeScript + Vite setup
  - Components: TodoList.vue, TodoItem.vue, TodoForm.vue
  - Store: todos store with Pinia
  - Tests: Component tests with vitest + @vue/test-utils
  - Scripts added to root package.json: dev:todo-app, build:todo-app, test:todo-app
  - Test project added to vitest.workspace.ts
```

### Example 2: Backend API

```
User: "Build a REST API for managing blog posts with CRUD endpoints"

AI Analysis:
- Package type: server
- Template: server-example
- Features: Express routes, blog post model, validation

Generated Package:
- packages/blog-api/
  - Express + TypeScript setup
  - Routes: GET/POST/PUT/DELETE /api/posts
  - Types: BlogPost interface
  - Tests: API endpoint tests with supertest
  - Scripts added to root package.json
  - Test project added to vitest.workspace.ts
```

### Example 3: Full-Stack App

```
User: "Create a weather dashboard that fetches data from an API and displays it"

AI Analysis:
- Package type: full-stack
- Template: full-stack-example
- Features: API proxy, data caching, visual charts

Generated Package:
- packages/weather-dashboard/
  - Server: Express API proxy with caching
  - Client: TypeScript SPA with data visualization
  - Shared: TypeScript types for weather data
  - Tests: Both client and server tests
  - Scripts added to root package.json
  - Test projects added to vitest.workspace.ts
```

---

## Constraints & Validation

### Monorepo Constraints

- Must use existing Node.js version requirements (^20.19.0 || >=22.12.0)
- Must follow workspace naming conventions in root package.json
- Must use consistent script naming patterns (dev:_, build:_, test:\*)
- Must place packages under `/packages` directory
- Must use `type: "module"` for ES modules
- Must set `private: true` for workspace packages

### Code Quality Constraints

- Must pass ESLint validation with existing rules
- Must pass TypeScript type checking (no `any` without explicit need)
- Must include at least one basic test file
- Must follow existing file structure patterns
- Must use consistent import/export patterns
- Must include proper package.json metadata

### Testing Constraints

- Client packages: Must use jsdom environment
- Server packages: Must use node environment
- Must integrate with root vitest.workspace.ts
- Must include package-specific test script
- Must use vitest ^4.0.17 (consistent with monorepo)

### Dependency Constraints

- Must use compatible versions with existing packages
- Must avoid duplicate dependencies where possible
- Must separate dependencies vs devDependencies correctly
- Must specify engines for Node.js version requirements

---

## Future Enhancements

- **Multi-package generation**: Create related packages in one go (e.g., API + client)
- **Migration assistant**: Convert external projects to monorepo packages
- **Dependency optimization**: Suggest moving shared dependencies to root
- **Pattern detection**: Learn from existing packages to improve generation
- **Template customization**: Allow users to create custom templates
- **Git integration**: Auto-commit generated packages with descriptive messages
- **Documentation generation**: Create README files for new packages
- **Deployment integration**: Connect with deployer app for immediate deployment
