create extension if not exists vector;

create table courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  order_index int not null default 0,
  objectives jsonb,
  prerequisites jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  uploaded_by uuid not null,
  filename text not null,
  file_type text not null,
  storage_path_original text not null,
  storage_path_derived text,
  status text not null default 'uploaded',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table unit_resources (
  unit_id uuid not null references units(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  primary key (unit_id, resource_id)
);

create table extracted_contents (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  plain_text text not null,
  segments jsonb not null,
  created_at timestamptz not null default now()
);

create table content_chunks (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  content text not null,
  pointer_start jsonb not null,
  pointer_end jsonb,
  embedding vector(1536),
  embedding_model text not null,
  token_count int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index content_chunks_resource_id_idx on content_chunks(resource_id);

create table agent_artifacts (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  agent text not null,
  schema_version int not null default 1,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index agent_artifacts_unit_agent_idx on agent_artifacts(unit_id, agent);

create table lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  title text not null,
  teaching_style text not null,
  ui_style text not null,
  version int not null default 1,
  pages jsonb not null,
  coverage jsonb not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  title text not null,
  items jsonb not null,
  created_at timestamptz not null default now()
);

create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  user_id uuid not null,
  answers jsonb not null,
  score numeric not null,
  feedback jsonb not null,
  created_at timestamptz not null default now()
);

create table progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null references courses(id) on delete cascade,
  unit_id uuid references units(id) on delete set null,
  lesson_id uuid references lessons(id) on delete set null,
  quiz_id uuid references quizzes(id) on delete set null,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index progress_events_user_time_idx on progress_events(user_id, created_at desc);

create table unit_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  unit_id uuid not null references units(id) on delete cascade,
  status text not null default 'not_started',
  last_accessed_at timestamptz,
  mastery numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (user_id, unit_id)
);

create table review_schedule_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  unit_id uuid not null references units(id) on delete cascade,
  due_at timestamptz not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index review_schedule_user_due_idx on review_schedule_items(user_id, due_at);

create table knowledge_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id uuid not null references lessons(id) on delete cascade,
  content text not null,
  explanation text,
  block_id uuid,
  created_at timestamptz not null default now()
);

create table user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  teaching_style text not null default 'progressive',
  ui_style text not null default 'neobrutalism',
  preferred_difficulty text not null default 'standard',
  session_length_minutes int not null default 25,
  reminder_timezone text not null default 'UTC',
  math_rendering text not null default 'katex',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
