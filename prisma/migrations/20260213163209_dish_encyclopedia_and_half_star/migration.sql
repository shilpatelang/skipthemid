/*
  Warnings:

  - You are about to drop the `Vote` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `price` on the `Dish` table. All the data in the column will be lost.
  - You are about to drop the column `restaurantId` on the `Dish` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `Dish` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Dish` table. All the data in the column will be lost.
  - Added the required column `category` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cuisine` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latitude` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Dish` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Dish` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Vote_dishId_userId_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "password" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Vote";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Place" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "dishId" TEXT NOT NULL,
    CONSTRAINT "Place_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" REAL NOT NULL,
    "dishId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Rating_dishId_fkey" FOREIGN KEY ("dishId") REFERENCES "Dish" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dish" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ingredients" JSONB,
    "steps" JSONB,
    "prepTime" INTEGER,
    "cookTime" INTEGER,
    "servings" INTEGER,
    "origin" TEXT NOT NULL,
    "cuisine" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dish" ("createdAt", "id", "name") SELECT "createdAt", "id", "name" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
CREATE UNIQUE INDEX "Dish_slug_key" ON "Dish"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Rating_dishId_userId_key" ON "Rating"("dishId", "userId");
