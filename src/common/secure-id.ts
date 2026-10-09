import { randomUUID } from 'node:crypto';

export function createSecureId(prefix: 'workspace' | 'project' | 'doc' | 'member') {
  return `${prefix}-${randomUUID()}`;
}
