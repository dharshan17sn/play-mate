-- CreateEnum
CREATE TYPE "public"."DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "preferredDays" "public"."DayOfWeek"[] DEFAULT ARRAY[]::"public"."DayOfWeek"[],
ADD COLUMN     "timeRange" TEXT;
