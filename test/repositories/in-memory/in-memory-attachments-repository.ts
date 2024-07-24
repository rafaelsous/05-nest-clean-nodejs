import { Attachment } from '@/domain/forum/enterprise/entities/attachment'
import { AttachmentsRepository } from '@/domain/forum/application/repositories/attachments-repository'

export class InMemoryAttachmentsRepository implements AttachmentsRepository {
  attachments: Attachment[] = []

  async create(attachment: Attachment) {
    this.attachments.push(attachment)
  }
}
