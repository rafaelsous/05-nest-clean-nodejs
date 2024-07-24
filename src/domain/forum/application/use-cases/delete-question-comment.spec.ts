import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { DeleteQuestionCommentUseCase } from './delete-question-comment'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { makeQuestionComment } from 'test/factories/make-question-comment'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory/in-memory-students-repository'
import { InMemoryQuestionCommentsRepository } from 'test/repositories/in-memory/in-memory-question-comments-repository'

let questionCommentsRepository: InMemoryQuestionCommentsRepository
let studentsRepository: InMemoryStudentsRepository
let sut: DeleteQuestionCommentUseCase // system under test

describe('Delete Question Comment Use Case', () => {
  beforeEach(() => {
    studentsRepository = new InMemoryStudentsRepository()

    questionCommentsRepository = new InMemoryQuestionCommentsRepository(
      studentsRepository,
    )

    sut = new DeleteQuestionCommentUseCase(questionCommentsRepository)
  })

  it('should be able to delete a question comment successfully', async () => {
    const questionComment = makeQuestionComment(
      {
        authorId: new UniqueEntityID('author-01'),
        questionId: new UniqueEntityID('question-01'),
        content: 'Question Comment Content',
      },
      new UniqueEntityID('question-comment-id'),
    )

    await questionCommentsRepository.create(questionComment)

    await sut.execute({
      authorId: questionComment.authorId.toString(),
      questionCommentId: questionComment.id.toString(),
    })

    expect(questionCommentsRepository.questionComments).toHaveLength(0)
  })

  it('should not be able to delete a question comment when it not exists', async () => {
    const result = await sut.execute({
      authorId: 'author-01',
      questionCommentId: 'not-existent-question-comment-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to delete a question comment from another author', async () => {
    const questionComment = makeQuestionComment(
      {
        authorId: new UniqueEntityID('author-01'),
      },
      new UniqueEntityID('question-comment-01'),
    )

    await questionCommentsRepository.create(questionComment)

    const result = await sut.execute({
      authorId: 'another-author-id',
      questionCommentId: 'question-comment-01',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
