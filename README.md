# Lumina Diamond POS — Frontend

Angular frontend for **Lumina Diamond POS**, a full-stack Point of Sale system for a diamond/jewelry store, built as an Oracle PL/SQL final project (BBU).

This is one half of the system. The other half — the backend API and Oracle database layer — lives here: **[oracle-project-backend](https://github.com/pichchanthorn/oracle-project-backend)**

## Architecture

```
Angular (this repo)  →  Node/Express API  →  Oracle Database
     frontend              backend
```

A browser app can't talk to Oracle directly, so this frontend calls the backend API, which handles the database connection.

## Tech stack

- Angular 21
- TypeScript

## Development server

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.19.

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

> Make sure the [backend API](https://github.com/pichchanthorn/oracle-project-backend) is running first (`http://localhost:3000`) so the app has data to load.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
