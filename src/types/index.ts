// Learning Star - Core Type Definitions
// Based on docs/system-design.md

// =============================================================================
// PRIMITIVES
// =============================================================================

export type UUID = string;
export type ISODateTime = string;

export type FileType = 'pdf' | 'pptx' | 'docx' | 'video' | 'audio' | 'txt' | 'md';

export type TeachingStyle = 'rigorous' | 'fun' | 'eli5' | 'progressive';
export type UiStyle = 'neobrutalism' | 'glassmorphism' | 'retro' | 'terminal';

export type ResourceStatus =
  | 'uploaded'
  | 'parsing'
  | 'parsed'
  | 'chunking'
  | 'embedded'
  | 'ready'
  | 'failed';

export type LessonStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'archived';

// =============================================================================
// SOURCE TRACEABILITY
// =============================================================================

export interface SourcePointer {
  resourceId: UUID;
  fileType: FileType;
  pageNumber?: number;
  slideNumber?: number;
  timeStartSec?: number;
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

// =============================================================================
// USER & PREFERENCES
// =============================================================================

export interface User {
  id: UUID;
  email: string;
  createdAt: ISODateTime;
}

export interface UserPreferences {
  userId: UUID;
  teachingStyle: TeachingStyle;
  uiStyle: UiStyle;
  preferredDifficulty: 'intro' | 'standard' | 'challenge';
  sessionLengthMinutes: 15 | 25 | 45 | 60;
  reminderTimezone: string;
  mathRendering: 'katex';
}

// =============================================================================
// COURSE HIERARCHY
// =============================================================================

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

// =============================================================================
// RESOURCES & CONTENT
// =============================================================================

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

// =============================================================================
// GENERATED LESSON (RENDERABLE JSON)
// =============================================================================

export type LessonPageType =
  | 'explanation'
  | 'worked_example'
  | 'practice'
  | 'quiz'
  | 'summary'
  | 'extension';

export type LessonBlock =
  | ({ type: 'heading'; text: string } & WithCitations)
  | ({ type: 'text'; markdown: string } & WithCitations)
  | ({ type: 'formula'; latex: string; displayMode: boolean } & WithCitations)
  | ({ type: 'image'; alt: string; storagePath: string } & WithCitations)
  | ({ type: 'code'; language: string; code: string } & WithCitations)
  | ({ type: 'callout'; kind: 'note' | 'warning' | 'tip'; markdown: string } & WithCitations)
  | ({ type: 'interactive'; widget: 'flashcards' | 'drag_drop' | 'graph'; data: unknown } & WithCitations)
  | ({ type: 'quiz_embed'; quizId: UUID } & WithCitations);

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

// =============================================================================
// QUIZ & ASSESSMENT
// =============================================================================

export type QuizItem =
  | ({
      id: UUID;
      type: 'multiple_choice';
      promptMarkdown: string;
      options: Array<{ id: string; text: string }>;
      correctOptionId: string;
      explanationMarkdown?: string;
    } & WithCitations)
  | ({
      id: UUID;
      type: 'short_answer';
      promptMarkdown: string;
      rubric: {
        keyPoints: string[];
        strictness: 'lenient' | 'standard' | 'strict';
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
  score: number;
  feedback: Array<{
    itemId: UUID;
    isCorrect: boolean;
    feedbackMarkdown?: string;
  }>;
  createdAt: ISODateTime;
}

// =============================================================================
// PROGRESS TRACKING
// =============================================================================

export type ProgressEventType =
  | 'lesson_started'
  | 'page_viewed'
  | 'block_interacted'
  | 'quiz_started'
  | 'quiz_submitted'
  | 'lesson_completed'
  | 'knowledge_point_saved';

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
  status: 'not_started' | 'in_progress' | 'completed' | 'review_due';
  lastAccessedAt?: ISODateTime;
  mastery: number;
  updatedAt: ISODateTime;
}

export interface ReviewScheduleItem {
  id: UUID;
  userId: UUID;
  unitId: UUID;
  dueAt: ISODateTime;
  reason: 'spaced_repetition' | 'low_mastery' | 'manual';
  createdAt: ISODateTime;
}

// =============================================================================
// KNOWLEDGE POINTS
// =============================================================================

export interface KnowledgePoint {
  id: UUID;
  userId: UUID;
  lessonId: UUID;
  content: string;
  explanation?: string;
  blockId?: UUID;
  createdAt: ISODateTime;
}

// =============================================================================
// AI PIPELINE ARTIFACTS
// =============================================================================

export type AgentName =
  | 'planner'
  | 'librarian'
  | 'designer'
  | 'builder'
  | 'debugger'
  | 'leader';

export interface AgentArtifact<T> {
  id: UUID;
  unitId: UUID;
  agent: AgentName;
  schemaVersion: number;
  payload: T;
  createdAt: ISODateTime;
}

// Planner
export interface LessonPlanTopic {
  id: string;
  title: string;
  learningObjectives: string[];
  prerequisites: string[];
  difficulty: 'intro' | 'standard' | 'challenge';
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

// Librarian
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

// Designer
export interface LessonUXPageSpec {
  id: string;
  pageType: LessonPageType;
  title: string;
  topicId?: string;
  blocks: Array<
    | { type: 'heading' }
    | { type: 'text' }
    | { type: 'formula' }
    | { type: 'image' }
    | { type: 'code' }
    | { type: 'callout'; kind: 'note' | 'warning' | 'tip' }
    | { type: 'interactive'; widget: 'flashcards' | 'drag_drop' | 'graph' }
    | { type: 'quiz_embed' }
  >;
}

export interface LessonUXBlueprint {
  unitId: UUID;
  uiStyle: UiStyle;
  pages: LessonUXPageSpec[];
}

// Debugger
export interface Issue {
  id: string;
  severity: 'low' | 'medium' | 'high';
  kind:
    | 'citation_missing'
    | 'math_error'
    | 'definition_inconsistent'
    | 'out_of_scope'
    | 'broken_quiz';
  description: string;
  affectedPageIds: UUID[];
}

export interface DebuggerOutput {
  unitId: UUID;
  fixedPages: LessonPage[];
  issues: Issue[];
}

// Leader
export interface ApprovedLesson {
  unitId: UUID;
  lesson: GeneratedLesson;
  decision: 'approved' | 'rejected';
  revisionNotes?: Array<{ issueId?: string; note: string }>;
}
