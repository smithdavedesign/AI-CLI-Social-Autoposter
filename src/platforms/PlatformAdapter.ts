export interface PlatformAdapter {
  readonly name: string;
  readonly rateLimitDelayMs: number;
  post(content: string): Promise<void>;
}
