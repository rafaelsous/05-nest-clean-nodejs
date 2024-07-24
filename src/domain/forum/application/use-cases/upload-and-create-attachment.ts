import { Injectable } from '@nestjs/common'

import { Uploader } from '../storage/uploader'
import { Either, left, right } from '@/core/either'
import { Attachment } from '../../enterprise/entities/attachment'
import { AttachmentUploadError } from './errors/attachment-upload-error'
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type'
import { AttachmentsRepository } from '../repositories/attachments-repository'

export interface UploadAndCreateAttachmentUseCaseRequest {
  fileName: string
  fileType: string
  body: Buffer
}

export type UploadAndCreateAttachmentUseCaseResponse = Either<
  InvalidAttachmentTypeError,
  {
    attachment: Attachment
  }
>

@Injectable()
export class UploadAndCreateAttachmentUseCase {
  constructor(
    private attachmentsRepository: AttachmentsRepository,
    private uploader: Uploader,
  ) {}

  async execute({
    fileName,
    fileType,
    body,
  }: UploadAndCreateAttachmentUseCaseRequest): Promise<UploadAndCreateAttachmentUseCaseResponse> {
    if (!/^(image\/(jpeg|png))$|^application\/pdf$/.test(fileType)) {
      return left(new InvalidAttachmentTypeError(fileType))
    }

    const { url } = await this.uploader.upload({
      fileName,
      fileType,
      body,
    })

    const attachment = Attachment.create({
      title: fileName,
      url,
    })

    if (!attachment) {
      return left(new AttachmentUploadError())
    }

    await this.attachmentsRepository.create(attachment)

    return right({
      attachment,
    })
  }
}
