import { OUTPUT_CHANNEL_NAME } from './constants';
import { createLogger } from '@local/vscode-wrapper/vscode-wrapper';

export const logger = createLogger(OUTPUT_CHANNEL_NAME);
