-- CreateTable
CREATE TABLE "ShortLink" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "destinationUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShortLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_slug_key" ON "ShortLink"("slug");

-- CreateIndex
CREATE INDEX "ShortLink_createdAt_idx" ON "ShortLink"("createdAt");
