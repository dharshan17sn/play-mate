/*
  Warnings:

  - You are about to drop the `TeamAdmin` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."TeamAdmin" DROP CONSTRAINT "TeamAdmin_teamId_fkey";

-- DropForeignKey
ALTER TABLE "public"."TeamAdmin" DROP CONSTRAINT "TeamAdmin_userId_fkey";

-- AlterTable
ALTER TABLE "public"."TeamMember" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."TeamAdmin";
