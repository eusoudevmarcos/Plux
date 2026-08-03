DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'CLIENT'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'COMPANY_ADMIN'
  ) THEN
    ALTER TYPE "UserRole" RENAME VALUE 'CLIENT' TO 'COMPANY_ADMIN';
  END IF;
END $$;

ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'COMPANY_ADMIN';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'COMPANY_ADMIN'
  ) THEN
    UPDATE "User"
    SET "role" = 'COMPANY_ADMIN'
    WHERE "role"::text = 'CLIENT';
  END IF;
END $$;
