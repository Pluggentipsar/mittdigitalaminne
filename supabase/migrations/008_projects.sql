-- 008: Projects - manual collections with metadata, above tags
-- Projects are distinct from Smart Spaces: manual membership vs saved filters

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#b45309',
  icon TEXT DEFAULT 'folder',
  deadline DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_sort_order ON projects(sort_order, created_at);

-- Junction table for memory-project relationship
CREATE TABLE memory_projects (
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (memory_id, project_id)
);

CREATE INDEX idx_memory_projects_project_id ON memory_projects(project_id);

-- RLS (single-user allow-all)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON memory_projects FOR ALL USING (true) WITH CHECK (true);

-- Reuse existing updated_at trigger
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
