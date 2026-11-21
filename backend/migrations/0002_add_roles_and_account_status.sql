-- Migration: 0002_add_roles_and_account_status.sql
-- Description: Adds role-based access control and account status attributes to users table

-- 1. Add role column with CHECK constraint (ADMIN or SUPER_ADMIN)
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER_ADMIN', 'ADMIN'));

-- 2. Add email_verified column with CHECK constraint (0 or 1)
ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1));

-- 3. Add account_status column with CHECK constraint (ACTIVE, INACTIVE, SUSPENDED)
ALTER TABLE users ADD COLUMN account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'));

-- 4. Add nullable verified_at timestamp column
ALTER TABLE users ADD COLUMN verified_at TEXT NULL;

-- 5. Add index on role for fast authorization checks
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
