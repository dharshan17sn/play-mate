-- CreateTable
CREATE TABLE "public"."TeamAdmin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamAdmin_userId_teamId_key" ON "public"."TeamAdmin"("userId", "teamId");

-- AddForeignKey
ALTER TABLE "public"."TeamAdmin" ADD CONSTRAINT "TeamAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamAdmin" ADD CONSTRAINT "TeamAdmin_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
