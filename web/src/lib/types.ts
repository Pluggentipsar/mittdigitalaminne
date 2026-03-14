export type ContentType = "image" | "link" | "article" | "thought" | "youtube" | "linkedin" | "instagram";

export interface Memory {
  id: string;
  content_type: ContentType;
  title: string;
  original_content: string | null;
  summary: string | null;
  image_url: string | null;
  image_storage_path: string | null;
  link_url: string | null;
  link_metadata: LinkMetadata | null;
  source: "mcp" | "web" | "manual";
  is_favorite: boolean;
  is_inbox: boolean;
  snapshot_html: string | null;
  snapshot_taken_at: string | null;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  memory_count?: number;
}

export interface LinkMetadata {
  favicon?: string;
  og_image?: string;
  og_description?: string;
  domain?: string;
  og_title?: string;
  video_id?: string;
  channel_name?: string;
  thumbnail_url?: string;
  author_name?: string;
}

export interface MemoryWithTags extends Memory {
  memory_tags: { tag_id: string; tags: Tag }[];
}

export interface MemoryNote {
  id: string;
  memory_id: string;
  content: string;
  created_at: string;
}

export interface MemoryFilters {
  query?: string;
  content_type?: ContentType;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  favorites_only?: boolean;
  is_inbox?: boolean;
  project_id?: string;
  sort?: "newest" | "oldest" | "title";
  limit?: number;
  offset?: number;
}

export interface RelatedMemory {
  id: string;
  content_type: ContentType;
  title: string;
  summary: string | null;
  image_url: string | null;
  link_url: string | null;
  link_metadata: LinkMetadata | null;
  created_at: string;
  shared_tag_count: number;
}

export interface SmartSpace {
  id: string;
  name: string;
  filters: Omit<MemoryFilters, "limit" | "offset">;
  icon: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  memory_count?: number;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  deadline: string | null;
  status: "active" | "archived";
  sort_order: number;
  created_at: string;
  updated_at: string;
  memory_count?: number;
}

export interface MemoryStats {
  total: number;
  this_week: number;
  favorites: number;
  inbox_count: number;
  by_type: Record<ContentType, number>;
  top_tags: { name: string; count: number }[];
  recent: { id: string; title: string; content_type: ContentType; created_at: string }[];
}
