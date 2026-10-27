-- Email + password auth: phone becomes optional, add password hash.
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
