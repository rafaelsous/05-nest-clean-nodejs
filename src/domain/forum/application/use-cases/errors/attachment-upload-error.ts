import { UseCaseError } from '@/core/errors/use-case-error'

export class AttachmentUploadError extends Error implements UseCaseError {
  constructor() {
    super('Failed to upload attachment.')
  }
}
