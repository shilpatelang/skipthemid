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
    "continent" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "region" TEXT,
    "course" TEXT NOT NULL DEFAULT '',
    "dietType" TEXT NOT NULL DEFAULT '',
    "imageUrl" TEXT,
    "imageCredit" TEXT,
    "imageLicenseUrl" TEXT,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Dish" ("category", "cookTime", "createdAt", "cuisine", "description", "id", "imageCredit", "imageLicenseUrl", "imageUrl", "ingredients", "latitude", "longitude", "name", "origin", "prepTime", "servings", "slug", "steps", "updatedAt") SELECT "category", "cookTime", "createdAt", "cuisine", "description", "id", "imageCredit", "imageLicenseUrl", "imageUrl", "ingredients", "latitude", "longitude", "name", "origin", "prepTime", "servings", "slug", "steps", "updatedAt" FROM "Dish";
DROP TABLE "Dish";
ALTER TABLE "new_Dish" RENAME TO "Dish";
CREATE UNIQUE INDEX "Dish_slug_key" ON "Dish"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
