# Learning Star - System Design

> A comprehensive system architecture for an AI-powered learning platform.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Information Flow](#information-flow)
3. [Data Models](#data-models)
4. [Backend Services](#backend-services)
5. [Frontend Pages](#frontend-pages)
6. [AI Pipeline](#ai-pipeline)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)

---

## Architecture Overview

```
                        +-----------------------------+
                        |          Next.js            |
                        |  App Router UI + API/tRPC   |
                        +--------------+--------------+
                                       |
                                       | (signed URLs / auth)
                                       v
+-------------------+        +-------------------+        +----------------------+
|   Student UI      |        |  Supabase Auth    |        |  Supabase Storage    |
| lessons/quizzes   |<------>|  users/sessions   |<------>| originals + derived  |
+---------+---------+        +-------------------+        +----------+-----------+
          |                                                          |
          | read lessons/quizzes                                     | store files
          v                                                          v
+-------------------+        +-------------------+        +----------------------+
|  Postgres (RLS)   |<------>| Inngest Workflows |<------>| ingestion-service    |
| courses, units,   | write  | pipeline runner   |  run   | parse/chunk/embed    |
| chunks, artifacts |        +---------+---------+        +----------+-----------+
+---------+---------+                  |                             |
          |                            | calls LLM + embeddings      |
          | vector search              v                             v
          | (pgvector)         +-------------------+        +----------------------+
          +------------------->| LLM Provider      |        | Vector store (same   |
                               | OpenAI/Anthropic  |        | Postgres pgvector)   |
                               +-------------------+        +----------------------+

Runtime:
Student asks Tutor -> tutor-api (SSE) -> retrieval from chunks/artifacts -> response + citations -> log -> progress-tracker
```

### Core Principle

Build around a single **source-grounded content graph**:

```
Resource → ExtractedContent → Chunks(embedding) → LessonPlan → UXBlueprint → LessonPages → ApprovedLesson
```

Every generated atom carries `citations[]` back to page/slide/timecode + chunk IDs.

---

## Information Flow

### Phase 1: Upload → Ingestion → Content Graph

```
1. User creates Course → Module → Unit
2. User uploads Resource to Supabase Storage
   └── resources.status = "uploaded"
3. Inngest ingestion job transitions:
   ├── "parsing": extract text/structure (PDF pages, PPT slides, transcripts)
   ├── "parsed": write extracted_contents + derived artifacts
   ├── "chunking": split into content_chunks with SourcePointer ranges
   ├── "embedded": compute embeddings, store in pgvector
   └── "ready": resource eligible for lesson building
```

### Phase 2: Lesson Production Pipeline

```
4. User triggers "Generate lesson" for a Unit
5. Inngest lesson-builder workflow loads:
   ├── unit metadata, objectives, prerequisites
   └── top relevant chunks (RAG) from unit's resources
6. Agents run sequentially, each writing typed JSON artifacts:
   ├── Planner  → LessonPlan
   ├── Librarian → SupplementalMaterials
   ├── Designer → LessonUXBlueprint
   ├── Builder  → LessonPages[]
   ├── Debugger → Corrected LessonPages[] + IssuesReport
   └── Leader   → ApprovedLesson (final gate)
```

### Phase 3: Student Consumption → Progress → Review

```
7. Student opens lesson: UI fetches GeneratedLesson.pages
8. Progress events emitted (page_viewed, quiz_submitted, etc.)
9. progress-tracker updates unit_progress rollups + mastery
10. scheduler generates review_schedule_items (spaced repetition)
11. Student completes reviews; mastery recalculates; future reviews adjust
```

---

## Data Models

### Shared Primitives

```typescript
export type UUID = string;
export type ISODateTime = string;

export type FileType = "pdf" | "pptx" | "docx" | "video" | "audio" | "txt" | "md";
export type TeachingStyle = "rigorous" | "fun" | "eli5" | "progressive";
export type UiStyle = "neobrutalism" | "glassmorphism" | "retro" | "terminal";

export type ResourceStatus =
  | "uploaded"
  | "parsing"
  | "parsed"
  | "chunking"
  | "embedded"
  | "ready"
  | "failed";

export type LessonStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "rejected"
  | "archived";
```

### Source Traceability

```typescript
export interface SourcePointer {
  resourceId: UUID;
  fileType: FileType;
  pageNumber?: number;      // PDF/DOCX
  slideNumber?: number;     // PPTX
  timeStartSec?: number;    // video/audio
  timeEndSec?: number;
  textStartOffset?: number;
  textEndOffset?: number;
}

export interface Citation {
  source: SourcePointer;
  chunkIds: UUID[];
  quote?: string;
}

export interface ExternalReference {
  url: string;
  title?: string;
  author?: string;
  publishedAt?: ISODateTime;
  accessedAt: ISODateTime;
  license?: string;
}

export interface WithCitations {
  citations: Citation[];
  externalReferences?: ExternalReference[];
}
```

### User & Preferences

```typescript
export interface User {
  id: UUID;
  email: string;
  createdAt: ISODateTime;
}

export interface UserPreferences {
  userId: UUID;
  teachingStyle: TeachingStyle;
  uiStyle: UiStyle;
  preferredDifficulty: "intro" | "standard" | "challenge";
  sessionLengthMinutes: 15 | 25 | 45 | 60;
  reminderTimezone: string;
  mathRendering: "katex";
}
```

### Course Hierarchy

```typescript
export interface Course {
  id: UUID;
  userId: UUID;
  title: string;
  description?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Module {
  id: UUID;
  courseId: UUID;
  title: string;
  orderIndex: number;
  description?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Unit {
  id: UUID;
  moduleId: UUID;
  title: string;
  orderIndex: number;
  objectives?: string[];
  prerequisites?: { unitId: UUID; reason?: string }[];
  resourceIds: UUID[];
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

### Resources & Content

```typescript
export interface Resource {
  id: UUID;
  courseId: UUID;
  uploadedBy: UUID;
  filename: string;
  fileType: FileType;
  storagePathOriginal: string;
  storagePathDerived?: string;
  status: ResourceStatus;
  errorMessage?: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface ExtractedContent {
  id: UUID;
  resourceId: UUID;
  plainText: string;
  segments: Array<{
    pointer: SourcePointer;
    text: string;
  }>;
  createdAt: ISODateTime;
}

export interface ContentChunk {
  id: UUID;
  resourceId: UUID;
  content: string;
  pointerStart: SourcePointer;
  pointerEnd?: SourcePointer;
  embeddingModel: string;
  tokenCount?: number;
  metadata?: Record<string, unknown>;
  createdAt: ISODateTime;
}
```

### Generated Lesson (Renderable JSON)

**Key rule**: Every renderable block includes `citations[]`.

```typescript
export type LessonPageType =
  | "explanation"
  | "worked_example"
  | "practice"
  | "quiz"
  | "summary"
  | "extension";

export type LessonBlock =
  | ({ type: "heading"; text: string } & WithCitations)
  | ({ type: "text"; markdown: string } & WithCitations)
  | ({ type: "formula"; latex: string; displayMode: boolean } & WithCitations)
  | ({ type: "image"; alt: string; storagePath: string } & WithCitations)
  | ({ type: "code"; language: string; code: string } & WithCitations)
  | ({ type: "callout"; kind: "note" | "warning" | "tip"; markdown: string } & WithCitations)
  | ({ type: "interactive"; widget: "flashcards" | "drag_drop" | "graph"; data: unknown } & WithCitations)
  | ({ type: "quiz_embed"; quizId: UUID } & WithCitations);

export interface LessonPage {
  id: UUID;
  pageType: LessonPageType;
  title: string;
  blocks: LessonBlock[];
}

export interface GeneratedLesson {
  id: UUID;
  unitId: UUID;
  title: string;
  teachingStyle: TeachingStyle;
  uiStyle: UiStyle;
  version: number;
  pages: LessonPage[];
  coverage: {
    resourceIds: UUID[];
    chunkIds: UUID[];
  };
  status: LessonStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}
```

### Quiz & Assessment

```typescript
export type QuizItem =
  | ({
      id: UUID;
      type: "multiple_choice";
      promptMarkdown: string;
      options: Array<{ id: string; text: string }>;
      correctOptionId: string;
      explanationMarkdown?: string;
    } & WithCitations)
  | ({
      id: UUID;
      type: "short_answer";
      promptMarkdown: string;
      rubric: {
        keyPoints: string[];
        strictness: "lenient" | "standard" | "strict";
      };
      referenceAnswerMarkdown?: string;
    } & WithCitations);

export interface QuizAssessment {
  id: UUID;
  unitId: UUID;
  title: string;
  items: QuizItem[];
  createdAt: ISODateTime;
}

export interface QuizAttempt {
  id: UUID;
  quizId: UUID;
  userId: UUID;
  answers: Array<
    | { itemId: UUID; selectedOptionId: string }
    | { itemId: UUID; freeText: string }
  >;
  score: number; // 0..1 normalized
  feedback: Array<{
    itemId: UUID;
    isCorrect: boolean;
    feedbackMarkdown?: string;
  }>;
  createdAt: ISODateTime;
}
```

### Progress Tracking

```typescript
export type ProgressEventType =
  | "lesson_started"
  | "page_viewed"
  | "block_interacted"
  | "quiz_started"
  | "quiz_submitted"
  | "lesson_completed"
  | "knowledge_point_saved";

export interface ProgressEvent {
  id: UUID;
  userId: UUID;
  courseId: UUID;
  unitId?: UUID;
  lessonId?: UUID;
  quizId?: UUID;
  type: ProgressEventType;
  payload: Record<string, unknown>;
  createdAt: ISODateTime;
}

export interface UnitProgress {
  id: UUID;
  userId: UUID;
  unitId: UUID;
  status: "not_started" | "in_progress" | "completed" | "review_due";
  lastAccessedAt?: ISODateTime;
  mastery: number; // 0..1
  updatedAt: ISODateTime;
}

export interface ReviewScheduleItem {
  id: UUID;
  userId: UUID;
  unitId: UUID;
  dueAt: ISODateTime;
  reason: "spaced_repetition" | "low_mastery" | "manual";
  createdAt: ISODateTime;
}
```

---

## Backend Services

Keep services **logically modular** but deploy as one Next.js + Inngest + Supabase system.

### Service Structure

```
src/lib/services/
├── ingestion/          # File processing pipeline
├── lesson-builder/     # AI content generation
├── quiz-engine/        # Quiz generation & grading
├── tutor-api/          # Real-time tutoring
├── progress-tracker/   # Progress events & rollups
└── scheduler/          # Review planning
```

### ingestion-service

**Responsibilities:**
- Signed upload URL creation
- File parsing by type → `ExtractedContent`
- Chunking strategy + `SourcePointer` mapping
- Embedding generation + pgvector upsert

### lesson-builder

**Responsibilities:**
- Inngest workflow orchestration
- Load unit context + retrieve chunks (RAG)
- Run agent prompts + validate JSON schemas
- Persist artifacts + final `GeneratedLesson`

### quiz-engine

**Responsibilities:**
- Generate quizzes from `LessonPages` + chunks
- Grade attempts (deterministic for MCQ, rubric-based for free text)
- Return item-level feedback

### tutor-api

**Responsibilities:**
- Real-time tutoring via SSE
- Grounded in unit chunks + lesson pages
- Always return answers with `citations[]`

### progress-tracker

**Responsibilities:**
- Append progress events
- Maintain rollups (`unit_progress`)
- Compute mastery scores

### scheduler

**Responsibilities:**
- Convert mastery + events into review queue
- Generate daily study plans

---

## Frontend Pages

### Page Structure

```
src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (dashboard)/
│   ├── layout.tsx              # Sidebar + header
│   ├── page.tsx                # Dashboard home
│   ├── courses/
│   │   ├── page.tsx            # Course list
│   │   ├── [courseId]/
│   │   │   ├── page.tsx        # Course overview (modules)
│   │   │   └── settings/page.tsx
│   ├── units/
│   │   └── [unitId]/
│   │       ├── page.tsx        # Unit learning page
│   │       ├── lesson/page.tsx # Interactive lesson viewer
│   │       └── quiz/page.tsx   # Practice quiz
│   ├── practice/
│   │   ├── page.tsx            # Practice hub
│   │   └── exam/page.tsx       # Mock exam mode
│   ├── progress/
│   │   └── page.tsx            # Personal progress dashboard
│   ├── schedule/
│   │   └── page.tsx            # Review schedule & calendar
│   └── settings/
│       └── page.tsx            # User preferences
└── api/                        # API routes
```

### Key Pages

| Page | Purpose | Key Components |
|------|---------|----------------|
| `/courses` | Course library | CourseCard, CreateCourseDialog |
| `/courses/[id]` | Course overview | ModuleList, UnitCard, UploadZone |
| `/units/[id]/lesson` | Lesson viewer | LessonRenderer, BlockRenderer, TutorChat |
| `/units/[id]/quiz` | Practice quiz | QuizPlayer, FeedbackPanel |
| `/practice/exam` | Mock exam | TimedQuiz, ResultsSummary |
| `/progress` | Progress dashboard | MasteryChart, StreakTracker, WeakAreas |
| `/schedule` | Review planner | CalendarView, TodaysTasks |

---

## AI Pipeline

### Agent Artifact Envelope

```typescript
export type AgentName =
  | "planner"
  | "librarian"
  | "designer"
  | "builder"
  | "debugger"
  | "leader";

export interface AgentArtifact<T> {
  id: UUID;
  unitId: UUID;
  agent: AgentName;
  schemaVersion: number;
  payload: T;
  createdAt: ISODateTime;
}
```

### Planner

**Input:**
```typescript
export interface PlannerInput {
  unit: Unit;
  userPreferences: UserPreferences;
  resources: Resource[];
  retrievedChunks: ContentChunk[];
}
```

**Output:**
```typescript
export interface LessonPlanTopic {
  id: string;
  title: string;
  learningObjectives: string[];
  prerequisites: string[];
  difficulty: "intro" | "standard" | "challenge";
  requiredWorkedExamples: number;
  citations: Citation[];
}

export interface LessonPlan {
  unitId: UUID;
  title: string;
  topics: LessonPlanTopic[];
  recommendedOrder: string[];
  glossary: Array<{ term: string; definition: string } & WithCitations>;
}
```

### Librarian

**Input:**
```typescript
export interface LibrarianInput {
  plan: LessonPlan;
  unitTags?: string[];
  allowExternalSources: boolean;
}
```

**Output:**
```typescript
export interface SupplementalMaterials {
  unitId: UUID;
  perTopic: Record<
    string,
    {
      references: ExternalReference[];
      canonicalExamples?: Array<{ title: string; url?: string; notes?: string }>;
      practiceSources?: Array<{ title: string; url: string }>;
    }
  >;
}
```

### Designer

**Input:**
```typescript
export interface DesignerInput {
  plan: LessonPlan;
  supplemental: SupplementalMaterials;
  userPreferences: UserPreferences;
}
```

**Output:**
```typescript
export interface LessonUXPageSpec {
  id: string;
  pageType: LessonPageType;
  title: string;
  topicId?: string;
  blocks: Array<
    | { type: "heading" }
    | { type: "text" }
    | { type: "formula" }
    | { type: "image" }
    | { type: "code" }
    | { type: "callout"; kind: "note" | "warning" | "tip" }
    | { type: "interactive"; widget: "flashcards" | "drag_drop" | "graph" }
    | { type: "quiz_embed" }
  >;
}

export interface LessonUXBlueprint {
  unitId: UUID;
  uiStyle: UiStyle;
  pages: LessonUXPageSpec[];
}
```

### Builder

**Input:**
```typescript
export interface BuilderInput {
  plan: LessonPlan;
  blueprint: LessonUXBlueprint;
  retrievedChunks: ContentChunk[];
  supplemental: SupplementalMaterials;
  teachingStyle: TeachingStyle;
}
```

**Output:**
```typescript
export interface BuilderOutput {
  unitId: UUID;
  pages: LessonPage[];
  proposedQuizzes?: Array<{
    title: string;
    items: QuizItem[];
  }>;
}
```

### Debugger

**Input:**
```typescript
export interface DebuggerInput {
  unitId: UUID;
  pages: LessonPage[];
  retrievedChunks: ContentChunk[];
  answerKeys?: Record<string, unknown>;
}
```

**Output:**
```typescript
export interface Issue {
  id: string;
  severity: "low" | "medium" | "high";
  kind:
    | "citation_missing"
    | "math_error"
    | "definition_inconsistent"
    | "out_of_scope"
    | "broken_quiz";
  description: string;
  affectedPageIds: UUID[];
}

export interface DebuggerOutput {
  unitId: UUID;
  fixedPages: LessonPage[];
  issues: Issue[];
}
```

### Leader

**Input:**
```typescript
export interface LeaderInput {
  unitId: UUID;
  plan: LessonPlan;
  blueprint: LessonUXBlueprint;
  pages: LessonPage[];
  issues: Issue[];
  constraints: {
    mustBeSourceGrounded: true;
    maxDifficulty?: "intro" | "standard" | "challenge";
  };
}
```

**Output:**
```typescript
export interface ApprovedLesson {
  unitId: UUID;
  lesson: GeneratedLesson;
  decision: "approved" | "rejected";
  revisionNotes?: Array<{ issueId?: string; note: string }>;
}
```

---

## Database Schema

```sql
-- Enable pgvector
create extension if not exists vector;

-- Core hierarchy
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

-- Resources (uploads)
create table resources (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  uploaded_by uuid not null,
  filename text not null,
  file_type text not null,
  storage_path_original text not null,
  storage_path_derived text,
  status text not null,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table unit_resources (
  unit_id uuid not null references units(id) on delete cascade,
  resource_id uuid not null references resources(id) on delete cascade,
  primary key (unit_id, resource_id)
);

-- Extracted content
create table extracted_contents (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references resources(id) on delete cascade,
  plain_text text not null,
  segments jsonb not null,
  created_at timestamptz not null default now()
);

-- Chunks + embeddings
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
create index content_chunks_embedding_idx on content_chunks 
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Agent artifacts
create table agent_artifacts (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  agent text not null,
  schema_version int not null default 1,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index agent_artifacts_unit_agent_idx on agent_artifacts(unit_id, agent);

-- Lessons
create table lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  title text not null,
  teaching_style text not null,
  ui_style text not null,
  version int not null default 1,
  pages jsonb not null,
  coverage jsonb not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Quizzes
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

-- Progress tracking
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
  status text not null,
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

-- Knowledge points (highlights/bookmarks)
create table knowledge_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id uuid not null references lessons(id) on delete cascade,
  content text not null,
  explanation text,
  block_id uuid,
  created_at timestamptz not null default now()
);
```

---

## API Endpoints

### Courses & Content

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/courses` | Create course |
| `GET` | `/api/courses` | List user's courses |
| `GET` | `/api/courses/:id` | Get course with modules |
| `POST` | `/api/modules` | Create module |
| `POST` | `/api/units` | Create unit |
| `PATCH` | `/api/units/:id` | Update unit |

### Resources & Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/resources/upload-url` | Get signed upload URL |
| `POST` | `/api/resources/:id/process` | Trigger ingestion job |
| `GET` | `/api/resources/:id/status` | Check processing status |

### Lessons & Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/units/:id/generate-lesson` | Trigger lesson generation |
| `GET` | `/api/lessons/:id` | Get generated lesson |
| `GET` | `/api/lessons/:id/status` | Check generation status |

### Quizzes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/quizzes/generate` | Generate quiz for unit |
| `GET` | `/api/quizzes/:id` | Get quiz |
| `POST` | `/api/quizzes/:id/attempts` | Submit and grade attempt |

### Progress & Schedule

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/progress/events` | Log progress event |
| `GET` | `/api/progress/units/:id` | Get unit progress |
| `GET` | `/api/schedule/today` | Get today's review items |
| `GET` | `/api/schedule/week` | Get weekly schedule |

### Tutoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tutor/stream` | SSE stream for tutoring |
| `POST` | `/api/tutor/message` | Send message to tutor |

---

## Design Principles

1. **Source grounding**: All content traceable to original materials via `citations[]`
2. **Structured outputs**: JSON schemas for all AI outputs, enabling multi-format rendering
3. **Event-driven progress**: Append-only event log with derived rollups
4. **Auditable pipeline**: Agent artifacts stored for debugging and improvement
5. **Modular but simple**: Logical service boundaries, single deployment

---

*Last updated: January 2026*
