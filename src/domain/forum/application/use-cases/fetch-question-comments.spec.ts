import { makeStudent } from 'test/factories/make-student'
import { makeQuestion } from 'test/factories/make-question'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchQuestionCommentsUseCase } from './fetch-question-comments'
import { makeQuestionComment } from 'test/factories/make-question-comment'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory/in-memory-students-repository'
import { InMemoryQuestionCommentsRepository } from 'test/repositories/in-memory/in-memory-question-comments-repository'

let questionCommentsRepository: InMemoryQuestionCommentsRepository
let studentsRepository: InMemoryStudentsRepository
let sut: FetchQuestionCommentsUseCase // system under test

describe('Fetch Question Comments Use Case', () => {
  beforeEach(() => {
    studentsRepository = new InMemoryStudentsRepository()
    questionCommentsRepository = new InMemoryQuestionCommentsRepository(
      studentsRepository,
    )
    sut = new FetchQuestionCommentsUseCase(questionCommentsRepository)
  })

  it('should be able to fetch question comments successfully', async () => {
    const student = makeStudent({
      name: 'John Doe',
    })

    studentsRepository.students.push(student)

    const question = makeQuestion({}, new UniqueEntityID('question-01'))

    for (let i = 1; i <= 21; i++) {
      await questionCommentsRepository.create(
        makeQuestionComment({
          questionId: question.id,
          authorId: student.id,
        }),
      )
    }

    const result = await sut.execute({
      questionId: 'question-01',
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.comments).toHaveLength(1)
    expect(result.value?.comments[0].authorId).toEqual(student.id)
  })
})
