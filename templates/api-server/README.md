# server

Express.js backend server for the website. Serves the Vue.js client in production and provides API endpoints.

## Overview

- **Framework**: Express.js 5
- **Language**: TypeScript
- **Runtime**: Node.js

In production, the server serves the built Vue.js client as static files and handles SPA routing.

## Project Setup

From the root of the monorepo:

```sh
npm install
```

### Development with Hot-Reload

```sh
npm run dev -w server
```

Watches all files in `src/` and automatically restarts on changes.

### Build for Production

```sh
npm run build -w server
```

Compiles TypeScript to JavaScript in the `dist/` folder.

### Run Production Server

```sh
npm run start -w server
```

Starts the server at `http://localhost:3000`.
