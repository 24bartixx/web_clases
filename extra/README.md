# Quick Start

## 1) Install

```bash
npm install
```

## 2) Prepare database

```bash
npm run prisma:migrate
npm run seed
```

## 3) Run project

```bash
npm start
```

## 4) Test GraphQL queries

After starting the app with `npm start`, test queries at:

http://localhost:4000/graphql

Query examples are in the [examples](examples/) folder.

## Useful

- Regenerate Prisma client (if schema changes):

```bash
npm run prisma:generate
```
