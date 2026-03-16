export interface PlatformAdapter {
  readonly name: string;
  readonly rateLimitDelayMs: number;
  post(content: string): Promise<void>;
}

export interface GeneratedContent {
  topic: string;
  linkedinPost: string;
  blueskyPost: string;
  generatedAt: string; // ISO 8601
}

export interface AppConfig {
  platforms: {
    linkedin: boolean;
    bluesky: boolean;
  };
  tone: string;
  topic: string;
  max_posts_per_day: number;
}

export interface Env {
  ANTHROPIC_API_KEY: string;
  LINKEDIN_ACCESS_TOKEN: string;
  LINKEDIN_PERSON_URN: string; // e.g. "urn:li:person:ABC123"
  BLUESKY_HANDLE: string; // e.g. "yourhandle.bsky.social"
  BLUESKY_APP_PASSWORD: string;
}

export interface PostCache {
  generatedContent: GeneratedContent;
  cachedAt: string;
}
