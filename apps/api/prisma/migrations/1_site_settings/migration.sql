-- CreateTable
CREATE TABLE "site_settings" (
    "key" VARCHAR(80) NOT NULL,
    "value" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

