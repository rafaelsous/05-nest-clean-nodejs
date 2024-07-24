import { makeAnswer } from 'test/factories/make-answer'
import { makeStudent } from 'test/factories/make-student'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { FetchAnswerCommentsUseCase } from './fetch-answer-comments'
import { makeAnswerComment } from 'test/factories/make-answer-comment'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory/in-memory-students-repository'
import { InMemoryAnswerCommentsRepository } from 'test/repositories/in-memory/in-memory-answer-comments-repository'

let answerCommentsRepository: InMemoryAnswerCommentsRepository
let studentsRepository: InMemoryStudentsRepository
let sut: FetchAnswerCommentsUseCase // system under test

describe('Fetch Answer Comments Use Case', () => {
  beforeEach(() => {
    studentsRepository = new InMemoryStudentsRepository()
    answerCommentsRepository = new InMemoryAnswerCommentsRepository(
      studentsRepository,
    )

    sut = new FetchAnswerCommentsUseCase(answerCommentsRepository)
  })

  it('should be able to fetch answer comments successfully', async () => {
    const student = makeStudent({
      name: 'John Doe',
    })

    studentsRepository.students.push(student)

    const answer = makeAnswer({}, new UniqueEntityID('answer-01'))

    for (let i = 1; i <= 21; i++) {
      await answerCommentsRepository.create(
        makeAnswerComment({
          answerId: answer.id,
          authorId: student.id,
        }),
      )
    }

    const result = await sut.execute({
      answerId: 'answer-01',
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.comments).toHaveLength(1)
    expect(result.value?.comments[0].authorId).toEqual(student.id)
  })
})
