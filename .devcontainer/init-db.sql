-- Nzila OS DevContainer Database Initialization
-- Creates development databases for all services

-- Main application database (already created by POSTGRES_DB env)
-- Additional databases for isolated testing

CREATE DATABASE nzila_test;
CREATE DATABASE nzila_union_eyes;
CREATE DATABASE nzila_abr;

-- Grant access
GRANT ALL PRIVILEGES ON DATABASE nzila_test TO nzila;
GRANT ALL PRIVILEGES ON DATABASE nzila_union_eyes TO nzila;
GRANT ALL PRIVILEGES ON DATABASE nzila_abr TO nzila;

-- Enable extensions
\c nzila_dev
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

\c nzila_test
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
