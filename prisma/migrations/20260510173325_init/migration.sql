-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nickname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'READER',
    "avatarColor" TEXT NOT NULL DEFAULT '#C67B3C',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "novels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "coverColor" TEXT NOT NULL DEFAULT '#C67B3C',
    "coverImage" TEXT,
    "genre" TEXT NOT NULL DEFAULT '',
    "readMode" TEXT NOT NULL DEFAULT 'swipe',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "novels_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "novel_id" TEXT NOT NULL,
    "pov_character_id" TEXT,
    CONSTRAINT "chapters_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chapters_pov_character_id_fkey" FOREIGN KEY ("pov_character_id") REFERENCES "characters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "avatarColor" TEXT NOT NULL DEFAULT '#C67B3C',
    "theme" TEXT NOT NULL DEFAULT '{"backgroundColor":"#FDF6EC","textColor":"#3D2B1F","accentColor":"#C67B3C","fontFamily":"serif","lineHeight":"relaxed"}',
    "novel_id" TEXT NOT NULL,
    CONSTRAINT "characters_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lore_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'notes',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "novel_id" TEXT NOT NULL,
    CONSTRAINT "lore_entries_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "novel_id" TEXT NOT NULL,
    "chapter_id" TEXT,
    "user_id" TEXT NOT NULL,
    CONSTRAINT "comments_novel_id_fkey" FOREIGN KEY ("novel_id") REFERENCES "novels" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");
