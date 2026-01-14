# Learning Star - AI-Powered Learning Platform

> An intelligent learning platform that transforms any educational content into personalized, interactive learning experiences.

---

## Project Overview

Learning Star is a self-hosted AI tutoring platform for learners who struggle with poorly-designed course materials. Upload PDFs, PPTXs, videos, or any educational content, and let a team of AI agents transform them into engaging, digestible lessons tailored to your learning style.

**Target User**: University students (initially self-use), especially those in CS/AI who find lecture slides confusing or boring.

---

## Tech Stack (MVP)

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui | Fast, type-safe UI |
| Backend | Next.js API Routes / tRPC | Type-safe API layer |
| Database | Supabase (Postgres) | Auth, DB, Storage, Realtime |
| Vector Search | pgvector | Semantic search over content chunks |
| Background Jobs | Inngest | File processing, content generation |
| LLM | OpenAI / Anthropic (abstracted) | AI agents |
| Math Rendering | KaTeX | Fast LaTeX/math symbol rendering |
| File Parsing | pdfjs-dist, mammoth, pptx2json | Extract content from uploads |
| Transcription | OpenAI Whisper API | Video/audio to text |

---

## Build / Lint / Test Commands

```bash
# Install dependencies
pnpm install

# Development
pnpm dev

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm typecheck

# Run all tests
pnpm test

# Run single test file
pnpm test path/to/file.test.ts

# Run tests matching pattern
pnpm test -t "pattern"
```

---

## Code Style Guidelines

### Imports
```typescript
// 1. External packages (alphabetized)
import { useState } from 'react';
import { z } from 'zod';

// 2. Internal aliases (alphabetized)
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

// 3. Relative imports
import { LocalComponent } from './local-component';
```

### TypeScript
- **Strict mode** enabled, no `any` types
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer `unknown` over `any`, then narrow with type guards
- All functions must have explicit return types (except React components)

### Naming Conventions
| Entity | Convention | Example |
|--------|------------|---------|
| Files (components) | kebab-case | `lesson-viewer.tsx` |
| Files (utils) | kebab-case | `parse-pdf.ts` |
| React Components | PascalCase | `LessonViewer` |
| Functions | camelCase | `parseDocument()` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| Types/Interfaces | PascalCase | `LessonContent` |
| Database tables | snake_case | `lesson_chunks` |

### Error Handling
```typescript
// Use Result pattern for expected failures
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

// Throw only for unexpected/programmer errors
// Log errors with context, never swallow silently
```

### React Patterns
- Server Components by default, `'use client'` only when needed
- Colocate components with their page when single-use
- Extract to `/components` when reused across pages
- Use `react-hook-form` + `zod` for forms

---

## AI Agent Architecture

### Runtime Teaching Agents (Student-Facing)

| Agent | Role | Personality |
|-------|------|-------------|
| **Tutor** | Patient homework helper, follow-ups on progress | Warm, encouraging, never condescending |
| **Professor** | Delivers structured lectures from processed content | Clear, adaptable depth, can be fun or rigorous |
| **Tracker** | Monitors study schedule, sends reminders | Friendly accountability partner |

### Content Production Team (Background)

| Agent | Role | Capabilities |
|-------|------|--------------|
| **Planner** | Analyzes uploaded content, creates lesson structure | Identifies concepts, prerequisites, learning path |
| **Librarian** | Fetches supplementary materials, examples, practice problems | Web search, documentation lookup |
| **Designer** | Decides visual layout, interactive elements, UI style | Matches user's preferred learning style |
| **Builder** | Generates actual lesson content, slides, quizzes | Creates markdown, MDX, interactive blocks |
| **Debugger** | Fixes issues in generated content, handles edge cases | Validates math, code examples, links |
| **Leader** | Orchestrates team, final quality check, can override any agent | Strongest model, ensures coherence |

### Agent Communication Pattern

```
User Upload → Planner (analyze) → Librarian (enrich)
                    ↓
            Designer (style decisions)
                    ↓
            Builder (generate content)
                    ↓
            Debugger (validate)
                    ↓
            Leader (final review) → Stored Lesson
```

---

## Storage Architecture

### File Storage (Supabase Storage)
```
/uploads/{user_id}/{course_id}/
  ├── originals/          # Original uploaded files (never modified)
  │   ├── lecture-1.pdf
  │   └── slides.pptx
  └── generated/          # AI-generated content
      ├── lessons/
      ├── quizzes/
      └── media/
```

### Database Schema (Simplified)

```sql
-- Courses / Folders
courses (id, user_id, title, created_at)

-- Uploaded source files
source_files (id, course_id, filename, storage_path, file_type, status)

-- Processed content chunks (for RAG)
content_chunks (id, source_file_id, content, embedding, page_number, metadata)

-- Generated lessons
lessons (id, course_id, title, content_json, teaching_style, ui_style)

-- User progress
user_progress (id, user_id, lesson_id, status, score, last_accessed)

-- Knowledge points (collected highlights)
knowledge_points (id, user_id, lesson_id, content, explanation, created_at)
```

---

## Teaching Styles (User Configurable)

| Style | Description |
|-------|-------------|
| `rigorous` | Academic, precise, complete coverage |
| `fun` | Casual, memes, relatable examples |
| `eli5` | Explain Like I'm 5, maximum simplicity |
| `progressive` | Start simple, gradually add complexity |

## UI Styles (3 Presets, Reusable Components)

| Style | Description |
|-------|-------------|
| `minimal` | Clean, lots of whitespace, focus on content |
| `high-contrast` | Bold colors, clear visual hierarchy, accessible |
| `playful` | Rounded corners, illustrations, gamified elements |

---

## Content Generation Outputs

| Format | Use Case |
|--------|----------|
| **Web Lesson** | Interactive HTML/MDX with embedded quizzes |
| **Slide Deck** | Redesigned PPTX with improved clarity |
| **Video Script** | AI-generated narration for content |
| **Practice Quiz** | Auto-generated questions from content |
| **Game Module** | Interactive web game for concept reinforcement |

---

## Key Features Checklist

### Phase 1: Core Platform
- [ ] File upload (PDF, PPTX, DOCX, video, audio)
- [ ] Content parsing and chunking pipeline
- [ ] Basic AI Tutor chat interface
- [ ] Math/LaTeX rendering (KaTeX)
- [ ] Folder organization for courses

### Phase 2: Smart Teaching
- [ ] AI Professor lecture mode (slide-by-slide)
- [ ] Highlight + knowledge point collection
- [ ] Extend buttons (examples, diagrams, quizzes)
- [ ] Teaching style customization
- [ ] Real-time feedback to adjust teaching

### Phase 3: Practice & Assessment
- [ ] Auto-generated practice problems
- [ ] Mock exam mode
- [ ] Progress tracking dashboard
- [ ] Spaced repetition for review

### Phase 4: Advanced
- [ ] Video/audio lesson generation
- [ ] Web game-based learning modules
- [ ] Study schedule planning (Tracker agent)
- [ ] Multi-device sync (cloud-first)

---

## Directory Structure

```
learning-star/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth-related routes
│   │   ├── (dashboard)/        # Main app routes
│   │   ├── api/                # API routes
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── lesson/             # Lesson viewing components
│   │   ├── upload/             # File upload components
│   │   └── chat/               # Tutor chat components
│   ├── lib/
│   │   ├── agents/             # AI agent definitions
│   │   ├── parsers/            # File parsing utilities
│   │   ├── db/                 # Database utilities
│   │   └── utils/              # General utilities
│   ├── hooks/                  # React hooks
│   └── types/                  # TypeScript type definitions
├── supabase/
│   ├── migrations/             # Database migrations
│   └── functions/              # Edge functions
├── public/
├── tests/
├── AGENTS.md                   # This file
├── package.json
└── tsconfig.json
```

---

## Future: Swift UI Migration Notes

For eventual iPad app development:
- Keep business logic in pure TypeScript (portable)
- Use REST/tRPC APIs (easily consumable from Swift)
- Store UI style tokens in JSON (map to SwiftUI styles)
- Database stays cloud (Supabase), accessible from any client
- Consider React Native as intermediate step before full Swift

---

## Development Principles

1. **User empathy first**: Every feature should reduce learning friction
2. **Content fidelity**: Never lose original content details during transformation
3. **Adaptive teaching**: The AI adjusts to the student, not the other way around
4. **Progressive enhancement**: Start simple, add complexity only when needed
5. **Cloud-native**: All data syncs, accessible from anywhere

---

## Agent Prompting Guidelines

When implementing AI agents, follow these patterns:

```typescript
// Agent prompt structure
const agentPrompt = {
  role: "system",
  content: `
    You are the ${agentName} agent for Learning Star.
    
    ## Your Role
    ${roleDescription}
    
    ## Your Personality  
    ${personalityTraits}
    
    ## Your Constraints
    - Never fabricate information not in the source material
    - Always cite which slide/page your information comes from
    - If unsure, say so and offer to find more information
    
    ## Current Context
    ${contextFromRAG}
  `
};
```

---

*Last updated: January 2026*
