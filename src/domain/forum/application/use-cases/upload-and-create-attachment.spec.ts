import { FakeUploader } from 'test/storage/fake-uploader'
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type'
import { UploadAndCreateAttachmentUseCase } from './upload-and-create-attachment'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory/in-memory-attachments-repository'

let attachmentsRepository: InMemoryAttachmentsRepository
let uploader: FakeUploader
let sut: UploadAndCreateAttachmentUseCase // system under test

describe('Upload and Create Attachment Use Case', () => {
  beforeEach(() => {
    attachmentsRepository = new InMemoryAttachmentsRepository()
    uploader = new FakeUploader()

    sut = new UploadAndCreateAttachmentUseCase(attachmentsRepository, uploader)
  })

  it('should be able to upload and create a new attachment successfully', async () => {
    const result = await sut.execute({
      fileName: 'file.pdf',
      fileType: 'application/pdf',
      body: Buffer.from('file-body'),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      attachment: attachmentsRepository.attachments[0],
    })
    expect(uploader.uploads).toHaveLength(1)
    expect(uploader.uploads[0]).toEqual(
      expect.objectContaining({
        fileName: 'file.pdf',
      }),
    )
  })

  it('should not be able to upload and create a new attachment with a invalid file type', async () => {
    const result = await sut.execute({
      fileName: 'file',
      fileType: 'invalid-file-type',
      body: Buffer.from('file-body'),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(InvalidAttachmentTypeError)
  })
})
