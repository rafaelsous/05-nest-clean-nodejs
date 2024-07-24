import { makeAnswer } from 'test/factories/make-answer'
import { CommentOnAnswerUseCase } from './comment-on-answer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { InMemoryAnswersRepository } from 'test/repositories/in-memory/in-memory-answers-repository'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory/in-memory-students-repository'
import { InMemoryAnswerCommentsRepository } from 'test/repositories/in-memory/in-memory-answer-comments-repository'
import { InMemoryAnswerAttachmentsRepository } from 'test/repositories/in-memory/in-memory-answer-attachments-repository'

let answerCommentsRepository: InMemoryAnswerCommentsRepository
let answerAttachmentsRepository: InMemoryAnswerAttachmentsRepository
let answersRepository: InMemoryAnswersRepository
let studentsRepository: InMemoryStudentsRepository
let sut: CommentOnAnswerUseCase // system under test

describe('Comment On Answer Use Case', () => {
  beforeEach(() => {
    studentsRepository = new InMemoryStudentsRepository()

    answerCommentsRepository = new InMemoryAnswerCommentsRepository(
      studentsRepository,
    )

    answerAttachmentsRepository = new InMemoryAnswerAttachmentsRepository()
    answersRepository = new InMemoryAnswersRepository(
      answerAttachmentsRepository,
    )

    sut = new CommentOnAnswerUseCase(
      answersRepository,
      answerCommentsRepository,
    )
  })

  it('should be able to comment on answer successfully', async () => {
    const answer = makeAnswer()
    await answersRepository.create(answer)

    const result = await sut.execute({
      authorId: 'author-01',
      answerId: answer.id.toString(),
      content: 'Answer Comment Content',
    })

    expect(result.isRight()).toBe(true)
    expect(answerCommentsRepository.answerComments[0]).toMatchObject({
      content: 'Answer Comment Content',
    })
  })

  it('should not be able to comment on answer when it not exists', async () => {
    const result = await sut.execute({
      authorId: 'author-01',
      answerId: 'answer-01',
      content: 'Answer Comment Content',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
