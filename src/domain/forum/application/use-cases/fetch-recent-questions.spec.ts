import { makeQuestion } from 'test/factories/make-question'
import { FetchRecentQuestionsUseCase } from './fetch-recent-questions'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory/in-memory-students-repository'
import { InMemoryQuestionsRepository } from 'test/repositories/in-memory/in-memory-questions-repository'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory/in-memory-attachments-repository'
import { InMemoryQuestionAttachmentsRepository } from 'test/repositories/in-memory/in-memory-question-attachments-repository'

let questionsRepository: InMemoryQuestionsRepository
let questionAttachmentsRepository: InMemoryQuestionAttachmentsRepository
let attachmentsRepository: InMemoryAttachmentsRepository
let studentsRepository: InMemoryStudentsRepository
let sut: FetchRecentQuestionsUseCase // system under test

describe('Fetch Recent Questions Use Case', () => {
  beforeEach(() => {
    questionAttachmentsRepository = new InMemoryQuestionAttachmentsRepository()

    questionsRepository = new InMemoryQuestionsRepository(
      questionAttachmentsRepository,
      attachmentsRepository,
      studentsRepository,
    )

    sut = new FetchRecentQuestionsUseCase(questionsRepository)
  })

  it('should be able to fetch sorted recent questions successfully', async () => {
    await questionsRepository.create(
      makeQuestion({ createdAt: new Date(205, 4, 29) }),
    )

    await questionsRepository.create(
      makeQuestion({ createdAt: new Date(205, 4, 25) }),
    )

    await questionsRepository.create(
      makeQuestion({ createdAt: new Date(205, 4, 27) }),
    )

    const result = await sut.execute({
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.questions).toHaveLength(3)
    expect(result.value?.questions).toEqual([
      expect.objectContaining({ createdAt: new Date(205, 4, 29) }),
      expect.objectContaining({ createdAt: new Date(205, 4, 27) }),
      expect.objectContaining({ createdAt: new Date(205, 4, 25) }),
    ])
  })

  it('should be able to fetch paginated recent questions successfully', async () => {
    for (let i = 1; i <= 21; i++) {
      await questionsRepository.create(makeQuestion())
    }

    const result = await sut.execute({
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.questions).toHaveLength(1)
  })
})
