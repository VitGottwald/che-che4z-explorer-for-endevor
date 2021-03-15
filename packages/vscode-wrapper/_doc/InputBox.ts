export interface PromptInputOptions {
  prompt?: string;
  /**
   * initial value
   */
  value?: string;
  password?: boolean;
  placeHolder?: string;
  validateInput?: (value: string) => string | undefined;
}
