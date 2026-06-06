CREATE TYPE "transaction_type" AS ENUM (
  'buy',
  'sell'
);

CREATE TABLE "users" (
  "user_id" integer PRIMARY KEY,
  "google_id" varchar UNIQUE,
  "first_name" varchar(255) NOT NULL,
  "last_name" varchar(255) NOT NULL,
  "picture" varchar,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "simulations" (
  "simulation_id" integer PRIMARY KEY,
  "initial_balance" decimal(12,2) NOT NULL,
  "start_date" timestamp NOT NULL,
  "current_date" timestamp NOT NULL,
  "finish_date" timestamp NOT NULL DEFAULT (now()),
  "user_id" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now()),
  "updated_at" timestamp NOT NULL DEFAULT (now()),
  "finished_at" timestamp
);

CREATE TABLE "stocks" (
  "stock_id" integer PRIMARY KEY,
  "ticker" varchar(10) UNIQUE NOT NULL,
  "company_name" varchar(255),
  "sector" varchar(120),
  "industry" varchar(120)
);

CREATE TABLE "positions" (
  "position_id" integer PRIMARY KEY,
  "simulation_id" integer NOT NULL,
  "stock_id" integer NOT NULL,
  "amount" decimal(14,2) NOT NULL DEFAULT 0
);

CREATE TABLE "transactions" (
  "transaction_id" integer PRIMARY KEY,
  "transaction_time" timestamp NOT NULL,
  "transaction_type" transaction_type NOT NULL,
  "price" decimal(12,2) NOT NULL,
  "amount" decimal(14,2) NOT NULL,
  "stock_id" integer NOT NULL,
  "simulation_id" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "simulation_history" (
  "history_id" integer PRIMARY KEY,
  "simulation_id" integer NOT NULL,
  "balance" decimal(12,2) NOT NULL,
  "profit_loss" decimal(12,2) NOT NULL DEFAULT 0,
  "available_funds" decimal(12,2) NOT NULL DEFAULT 0,
  "timestamp" timestamp NOT NULL DEFAULT (now()),
  "created_at" timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE "summaries" (
  "summary_id" integer PRIMARY KEY,
  "income" decimal(12,0) NOT NULL,
  "transactions" integer NOT NULL,
  "final_balance" decimal(12,2) NOT NULL,
  "stock_id" integer,
  "simulation_id" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT (now())
);

ALTER TABLE "simulations" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "positions" ADD FOREIGN KEY ("simulation_id") REFERENCES "simulations" ("simulation_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "positions" ADD FOREIGN KEY ("stock_id") REFERENCES "stocks" ("stock_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("stock_id") REFERENCES "stocks" ("stock_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "transactions" ADD FOREIGN KEY ("simulation_id") REFERENCES "simulations" ("simulation_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "simulation_history" ADD FOREIGN KEY ("simulation_id") REFERENCES "simulations" ("simulation_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "summaries" ADD FOREIGN KEY ("stock_id") REFERENCES "stocks" ("stock_id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "summaries" ADD FOREIGN KEY ("simulation_id") REFERENCES "simulations" ("simulation_id") DEFERRABLE INITIALLY IMMEDIATE;
