# Package Generator Implementation Plan

## Overview

An AI-powered local web application that generates new monorepo packages from natural language descriptions. Uses Claude SDK for intelligent code generation while ensuring compliance with monorepo conventions, lint rules, and testing infrastructure.

---

## Implementation Phases

### Phase 1: Core Infrastructure ⏳

**Goal**: Set up project structure, AI agent foundation, and basic services

#### Setup Tasks

- [ ] Create `/package-generator/app` directory structure
- [ ] Initialize package.json with dependencies
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up Express server with TypeScript
- [ ] Install Claude SDK (`@anthropic-ai/sdk`)
- [ ] Create environment config (.env for API keys)
- [ ] Set up basic logging utility

#### Core Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.x.x",
    "express": "^5.0.1",
    "dotenv": "^16.x.x"
  },
  "devDependencies": {
    "@types/express": "^5.0.6",
    "@types/node": "^22.10.5",
    "tsx": "^4.19.2",
    "typescript": "^5.9.3"
  }
}
```

#### File Structure

```
/package-generator
  /app
    /src
      /server
        index.ts              # Express server entry
        routes.ts             # API routes
      /services
        agent.ts              # Claude AI agent orchestrator
        template-reader.ts    # Reads existing example templates
        intent-analyzer.ts    # Analyzes user's app description
        code-generator.ts     # Generates package files
        config-manager.ts     # Updates root configs
        validator.ts          # Validates generated code
      /types
        index.ts              # TypeScript definitions
      /utils
        logger.ts             # Logging utility
        file-system.ts        # File operation helpers
    /data
      generations.json        # Generation history
    package.json
    tsconfig.json
    .env                      # ANTHROPIC_API_KEY
    .env.example
```

---

### Phase 2: Template Analysis & AI Agent ⏳

**Goal**: Implement services to read existing templates and set up AI agent

#### Template Reader Service

- [ ] Scan packages/\*-example directories
- [ ] Extract template structure (files, folders, dependencies)
- [ ] Parse package.json for each template
- [ ] Extract common patterns (imports, exports, test structure)
- [ ] Build template metadata cache

**Template Metadata Structure**:

```typescript
interface TemplateMetadata {
  name: 'client' | 'server' | 'full-stack';
  basePath: string;
  structure: FileNode[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
  patterns: {
    imports: string[];
    exports: string[];
    testPatterns: string[];
  };
}
```

#### AI Agent Service

- [ ] Initialize Claude SDK client
- [ ] Create agent conversation management
- [ ] Implement tool calling for file system operations
- [ ] Set up context management (system prompts)
- [ ] Implement streaming response handling
- [ ] Add error handling and retry logic

**Agent Tools**:

1. `read_template` - Read example template files
2. `analyze_requirements` - Extract structured requirements from description
3. `validate_package_name` - Check if name is available and valid
4. `preview_structure` - Show planned file structure
5. `generate_file` - Create individual files
6. `update_config` - Modify root configuration files

---

### Phase 3: Intent Analysis & Package Classification ⏳

**Goal**: Parse user descriptions and determine package requirements

#### Intent Analyzer Service

- [ ] Use Claude to parse natural language description
- [ ] Extract key information:
  - Package type (client/server/full-stack)
  - Framework preferences
  - Required features
  - Data requirements
  - API needs
  - Authentication needs
  - Testing requirements
- [ ] Generate clarifying questions when ambiguous
- [ ] Build structured requirements object

**Requirements Object**:

```typescript
interface PackageRequirements {
  packageType: 'client' | 'server' | 'full-stack';
  packageName: string;
  description: string;
  features: string[];
  dependencies: {
    suggested: string[];
    required: string[];
  };
  hasDatabase: boolean;
  hasAuth: boolean;
  hasAPI: boolean;
  testingNeeds: string[];
  clarifications?: ClarificationQuestion[];
}
```

#### Classification Logic

- [ ] Analyze keywords for package type hints:
  - Client: "UI", "component", "dashboard", "frontend", "Vue"
  - Server: "API", "endpoint", "REST", "backend", "Express"
  - Full-stack: "app with API", "full application", "both frontend and backend"
- [ ] Detect framework requirements
- [ ] Identify third-party integrations
- [ ] Determine testing scope

---

### Phase 4: Code Generation Engine ⏳

**Goal**: Generate package files with AI-customized code

#### Code Generator Service

- [ ] Implement template copying with modifications
- [ ] Generate package.json from template + requirements
- [ ] Create src directory structure
- [ ] Generate main entry files (index.ts, App.vue, etc.)
- [ ] Generate component/route files based on features
- [ ] Create TypeScript interfaces and types
- [ ] Generate test files with basic test cases
- [ ] Create configuration files (tsconfig, vite.config, etc.)

**Generation Steps**:

1. **Copy base structure** from selected template
2. **Customize package.json**:
   - Set name, description, version
   - Add/remove dependencies based on requirements
   - Adjust scripts if needed
3. **Generate source files**:
   - Use Claude to write custom code based on requirements
   - Follow existing patterns from template
   - Maintain TypeScript typing
   - Add proper imports/exports
4. **Generate tests**:
   - Create test files matching source structure
   - Write basic test cases with assertions
   - Use appropriate testing libraries (vitest + vue-test-utils or supertest)
5. **Create configs**:
   - tsconfig.json (inherit from appropriate base)
   - vite.config.ts (for client packages)
   - vitest.config.ts (if needed for custom test config)

**AI Prompting Strategy**:

```typescript
const systemPrompt = `
You are a code generator for a monorepo. Generate production-ready code that:
- Follows TypeScript best practices
- Uses ES modules (type: "module")
- Includes proper error handling
- Has comprehensive JSDoc comments
- Follows existing patterns from templates
- Passes ESLint with these rules: [rules from eslint.config.js]
`;

const generateFilePrompt = (requirements: PackageRequirements, fileName: string) => `
Generate ${fileName} for a ${requirements.packageType} package.

Requirements:
${JSON.stringify(requirements, null, 2)}

Template reference:
${templateFileContent}

Generate the complete file content following the template patterns.
`;
```

---

### Phase 5: Configuration Management ⏳

**Goal**: Update root monorepo configuration files

#### Config Manager Service

- [ ] **Update root package.json**:
  - Add workspace to workspaces array
  - Add dev script: `"dev:package-name": "npm run dev -w package-name"`
  - Add build script: `"build:package-name": "npm run build -w package-name"`
  - Add test script: `"test:package-name": "vitest --project package-name"`
- [ ] **Update vitest.workspace.ts**:
  - Add new test project configuration
  - Set appropriate test environment (jsdom/node)
  - Configure root directory and plugins
- [ ] **Verify ESLint compatibility**:
  - Ensure generated code will pass existing rules
  - No updates needed (eslint.config.js uses glob patterns)
- [ ] **Create backup before modifications**:
  - Save original config state
  - Allow rollback on failure

**Config Update Logic**:

```typescript
interface ConfigUpdate {
  file: string;
  type: 'insert' | 'append' | 'modify';
  location?: string; // JSON path or line number
  content: string;
}

async function updateRootConfigs(packageName: string, packageType: string) {
  const updates: ConfigUpdate[] = [
    // Add workspace
    {
      file: 'package.json',
      type: 'insert',
      location: '$.workspaces',
      content: `packages/${packageName}`,
    },
    // Add scripts
    {
      file: 'package.json',
      type: 'insert',
      location: '$.scripts',
      content: {
        [`dev:${packageName}`]: `npm run dev -w ${packageName}`,
        [`build:${packageName}`]: `npm run build -w ${packageName}`,
        [`test:${packageName}`]: `vitest --project ${packageName}`,
      },
    },
    // Add vitest project
    {
      file: 'vitest.workspace.ts',
      type: 'insert',
      location: 'test.projects',
      content: generateVitestProjectConfig(packageName, packageType),
    },
  ];

  return applyConfigUpdates(updates);
}
```

---

### Phase 6: Validation & Testing ⏳

**Goal**: Ensure generated packages are valid and functional

#### Validator Service

- [ ] **TypeScript validation**:
  - Run `tsc --noEmit` on generated package
  - Check for type errors
  - Report issues to user
- [ ] **ESLint validation**:
  - Run `eslint packages/package-name/**/*.ts`
  - Check for lint errors
  - Auto-fix if possible
- [ ] **Dependency check**:
  - Verify all imports are available in dependencies
  - Check for missing peer dependencies
  - Validate version compatibility
- [ ] **Test execution**:
  - Run `npm test` for generated package
  - Ensure basic tests pass
  - Report test results

**Validation Flow**:

```typescript
async function validateGeneratedPackage(packageName: string) {
  const results = {
    typescript: { passed: false, errors: [] },
    eslint: { passed: false, errors: [] },
    dependencies: { passed: false, missing: [] },
    tests: { passed: false, failures: [] },
  };

  // 1. Type check
  results.typescript = await runTypeCheck(packageName);

  // 2. Lint check
  results.eslint = await runEslint(packageName);

  // 3. Dependency check
  results.dependencies = await checkDependencies(packageName);

  // 4. Run tests
  if (results.typescript.passed && results.dependencies.passed) {
    await installDependencies(packageName);
    results.tests = await runTests(packageName);
  }

  return results;
}
```

---

### Phase 7: API Layer ⏳

**Goal**: Create REST API for frontend interaction

#### API Endpoints

**1. Generate Package**

```
POST /api/generate
Body: { description: string, preferences?: object }
Response: {
  conversationId: string,
  clarifications?: ClarificationQuestion[],
  requirements?: PackageRequirements
}
```

**2. Answer Clarifications**

```
POST /api/generate/:conversationId/clarify
Body: { answers: Record<string, string> }
Response: {
  requirements: PackageRequirements,
  preview: PackagePreview
}
```

**3. Confirm Generation**

```
POST /api/generate/:conversationId/confirm
Body: { packageName: string, customizations?: object }
Response: {
  status: 'generating' | 'validating' | 'completed' | 'failed',
  progress: number,
  logs: string[]
}
```

**4. Get Generation Status**

```
GET /api/generate/:conversationId/status
Response: {
  status: string,
  progress: number,
  currentStep: string,
  logs: string[],
  validationResults?: ValidationResults
}
```

**5. Get Generation History**

```
GET /api/generations
Response: GenerationRecord[]
```

**6. Rollback Generation**

```
POST /api/generate/:conversationId/rollback
Response: { success: boolean, message: string }
```

---

### Phase 8: Frontend UI ⏳

**Goal**: Create simple, interactive web interface

#### Pages & Components

**1. Generator Page** (Main Interface)

- Large text area for app description
- "Generate" button to start process
- Real-time status display
- Conversation-style clarification prompts

**2. Clarification View**

- Display clarification questions
- Input fields for answers
- "Continue" button to proceed

**3. Preview View**

- Package structure tree visualization
- List of files to be created
- Dependencies to be installed
- Config changes to be made
- Package name input (editable)
- "Confirm" and "Modify" buttons

**4. Progress View**

- Step-by-step progress indicator
- Real-time log streaming
- Validation results display
- Success/error notifications

**5. History View**

- List of previously generated packages
- Generation timestamp
- Package type and name
- Status (success/failed)
- "View details" link

#### UI Flow

```
┌─────────────────────┐
│  Describe App Idea  │
└──────────┬──────────┘
           ↓
    ┌──────────────┐
    │ AI Analysis  │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │ Clarifications│ (if needed)
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │   Preview    │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │  Generating  │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │  Validating  │
    └──────┬───────┘
           ↓
    ┌──────────────┐
    │   Complete!  │
    └──────────────┘
```

---

### Phase 9: Integration & Polish ⏳

**Goal**: Complete end-to-end functionality and refinements

#### Integration Tasks

- [ ] Connect all services into complete workflow
- [ ] Implement rollback on failure
- [ ] Add comprehensive error handling
- [ ] Create detailed logging at each step
- [ ] Test with various app descriptions
- [ ] Validate against all three template types

#### Polish Tasks

- [ ] Improve AI prompts based on testing
- [ ] Optimize token usage (caching, efficient prompts)
- [ ] Add loading states and better UX
- [ ] Create helpful error messages
- [ ] Add example descriptions for users
- [ ] Write usage documentation

#### Testing Scenarios

1. **Simple client app**: "Create a counter app with increment/decrement buttons"
2. **Server API**: "Build a REST API for managing tasks"
3. **Full-stack app**: "Create a notes app with CRUD operations"
4. **Complex requirements**: "Build a chat application with real-time messaging"
5. **Ambiguous description**: "Make me a website"
6. **Edge cases**: Invalid names, conflicting requirements

---

## Architecture Details

### Data Models

```typescript
// Generation conversation state
interface GenerationConversation {
  id: string;
  description: string;
  requirements?: PackageRequirements;
  clarifications?: ClarificationQuestion[];
  answers?: Record<string, string>;
  status:
    | 'analyzing'
    | 'clarifying'
    | 'previewing'
    | 'generating'
    | 'validating'
    | 'completed'
    | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

// Package requirements extracted by AI
interface PackageRequirements {
  packageType: 'client' | 'server' | 'full-stack';
  packageName: string;
  description: string;
  features: string[];
  dependencies: {
    suggested: string[];
    required: string[];
  };
  testingNeeds: string[];
  hasDatabase: boolean;
  hasAuth: boolean;
  hasAPI: boolean;
}

// Preview of what will be generated
interface PackagePreview {
  packageName: string;
  packageType: string;
  fileTree: FileNode[];
  dependencies: string[];
  scriptsToAdd: Record<string, string>;
  configChanges: ConfigUpdate[];
}

// File node in tree structure
interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  preview?: string; // First few lines of content
}

// Generation result record
interface GenerationRecord {
  id: string;
  packageName: string;
  packageType: string;
  description: string;
  status: 'success' | 'failed';
  createdAt: Date;
  duration: number; // milliseconds
  validationResults?: ValidationResults;
  error?: string;
}

// Validation results
interface ValidationResults {
  typescript: { passed: boolean; errors: string[] };
  eslint: { passed: boolean; errors: string[] };
  dependencies: { passed: boolean; missing: string[] };
  tests: { passed: boolean; failures: string[] };
}

// Clarification question from AI
interface ClarificationQuestion {
  id: string;
  question: string;
  type: 'choice' | 'text' | 'boolean';
  options?: string[];
  defaultValue?: string;
}
```

### Agent Workflow

```typescript
class PackageGeneratorAgent {
  async generatePackage(description: string): Promise<GenerationConversation> {
    // Phase 1: Analyze intent
    const requirements = await this.analyzeIntent(description);

    // Phase 2: Ask clarifications if needed
    if (requirements.clarifications?.length) {
      return { status: 'clarifying', requirements };
    }

    // Phase 3: Select template
    const template = await this.selectTemplate(requirements.packageType);

    // Phase 4: Generate preview
    const preview = await this.generatePreview(requirements, template);

    return { status: 'previewing', requirements, preview };
  }

  async confirmAndGenerate(conversationId: string, packageName: string) {
    // Phase 5: Generate files
    const files = await this.generateFiles(requirements, template);

    // Phase 6: Write to file system
    await this.writePackage(packageName, files);

    // Phase 7: Update configs
    await this.updateConfigs(packageName, requirements.packageType);

    // Phase 8: Install dependencies
    await this.installDependencies(packageName);

    // Phase 9: Validate
    const validationResults = await this.validate(packageName);

    // Phase 10: Rollback if validation fails
    if (!validationResults.typescript.passed) {
      await this.rollback(packageName);
      throw new Error('Validation failed');
    }

    return { status: 'completed', validationResults };
  }
}
```

---

## Key Design Decisions

### Why Claude SDK?

- Advanced code generation capabilities
- Function/tool calling for structured operations
- Long context window for template analysis
- Streaming support for real-time feedback
- High-quality TypeScript generation

### Why Template-Based Approach?

- Ensures consistency with existing packages
- Faster generation than pure AI synthesis
- Guarantees working configuration
- Reduces token usage
- Easier to validate and test
- AI enhances templates rather than creating from scratch

### Why Validation Before Completion?

- Catch errors before user sees the package
- Prevent broken code in monorepo
- Ensure tests pass out of the box
- Maintain code quality standards
- Provide immediate feedback on issues

### Why Conversational Flow?

- Clarifications improve generation quality
- Users can guide the AI with preferences
- Preview allows review before generation
- Reduces wasted generations
- Better user control and transparency

### Why Local-First?

- Works with local monorepo structure
- No external service dependencies (except Claude API)
- Full control over generated code
- Fast file system operations
- Easy to debug and iterate

### Why JSON for Generation History?

- Simple persistence for MVP
- Easy to inspect generation records
- No database setup required
- Sufficient for local tool usage
- Can migrate to SQL later if needed

---

## Development Roadmap

### Week 1: Foundation

- [ ] Set up project structure
- [ ] Configure TypeScript and Express
- [ ] Install Claude SDK
- [ ] Create basic server
- [ ] Implement template reader

### Week 2: AI Agent Core

- [ ] Initialize Claude agent
- [ ] Implement intent analyzer
- [ ] Build clarification system
- [ ] Create requirement extraction

### Week 3: Code Generation

- [ ] Implement code generator service
- [ ] Create file generation logic
- [ ] Build config manager
- [ ] Add validation service

### Week 4: API & Frontend

- [ ] Build REST API endpoints
- [ ] Create frontend UI
- [ ] Implement progress tracking
- [ ] Add history view

### Week 5: Testing & Polish

- [ ] Test with various scenarios
- [ ] Fix bugs and edge cases
- [ ] Optimize AI prompts
- [ ] Write documentation
- [ ] Final integration testing

---

## Future Enhancements

### Advanced Features

- [ ] **Multi-package generation**: Generate related packages (e.g., API + client) in one go
- [ ] **Template customization**: Allow users to create custom templates
- [ ] **Pattern learning**: Learn from existing packages beyond just examples
- [ ] **Dependency optimization**: Suggest moving shared dependencies to root
- [ ] **Migration assistant**: Convert external projects into monorepo packages
- [ ] **Code refactoring**: Modify existing packages based on descriptions

### AI Improvements

- [ ] **Fine-tuning**: Create custom model trained on monorepo patterns
- [ ] **Caching**: Cache template analysis and common patterns
- [ ] **Embeddings**: Use vector search for similar package references
- [ ] **Multi-agent**: Different agents for analysis, generation, validation

### Integration

- [ ] **Git integration**: Auto-commit generated packages with descriptive messages
- [ ] **Deployer integration**: Direct deployment after generation
- [ ] **VSCode extension**: Generate packages from IDE
- [ ] **CLI interface**: Command-line package generation

### Developer Experience

- [ ] **Hot reload**: Watch mode for template changes
- [ ] **Diff view**: Show changes before applying
- [ ] **Undo/redo**: Full generation history with rollback
- [ ] **Template marketplace**: Share and download community templates
