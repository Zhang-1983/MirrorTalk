-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_dialogue_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "realtime_metrics" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "user_id" TEXT NOT NULL,
    "scenario_id" TEXT,
    CONSTRAINT "dialogue_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dialogue_sessions_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_dialogue_sessions" ("created_at", "id", "metadata", "realtime_metrics", "scenario_id", "status", "updated_at", "user_id") SELECT "created_at", "id", "metadata", "realtime_metrics", "scenario_id", "status", "updated_at", "user_id" FROM "dialogue_sessions";
DROP TABLE "dialogue_sessions";
ALTER TABLE "new_dialogue_sessions" RENAME TO "dialogue_sessions";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
