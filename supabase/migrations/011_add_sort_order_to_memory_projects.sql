-- 011: Add sort_order column to memory_projects for drag-and-drop reordering
--
-- Allows users to manually reorder memories within a project.
-- Default 0 means "use insertion order" (added_at) as fallback.

ALTER TABLE memory_projects ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_memory_projects_sort
  ON memory_projects (project_id, sort_order);
