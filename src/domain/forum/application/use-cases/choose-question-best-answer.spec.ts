import { Either } from '@/core/either'
import { makeAnswer } from 'test/factories/make-answer'
import { makeQuestion } from 'test/factories/make-question'
import { Question } from '../../enterprise/entities/question'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ChooseQuestionBestAnswerUseCase } from './choose-question-best-answer'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { InMemoryAnswersRepository } from 'test/repositories/in-memory/in-memory-answers-repository'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory/in-memory-students-repository'
import { InMemoryQuestionsRepository } from 'test/repositories/in-memory/in-memory-questions-repository'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory/in-memory-attachments-repository'
import { InMemoryAnswerAttachmentsRepository } from 'test/repositories/in-memory/in-memory-answer-attachments-repository'
import { InMemoryQuestionAttachmentsRepository } from 'test/repositories/in-memory/in-memory-question-attachments-repository'

let questionsRepository: InMemoryQuestionsRepository
let answersRepository: InMemoryAnswersRepository
let questionAttachmentsRepository: InMemoryQuestionAttachmentsRepository
let answerAttachmentsRepository: InMemoryAnswerAttachmentsRepository
let attachmentsRepository: InMemoryAttachmentsRepository
let studentsRepository: InMemoryStudentsRepository
let sut: ChooseQuestionBestAnswerUseCase // system under test

describe('Choose Question Best Answer Use Case', () => {
  beforeEach(() => {
    questionAttachmentsRepository = new InMemoryQuestionAttachmentsRepository()
    attachmentsRepository = new InMemoryAttachmentsRepository()
    studentsRepository = new InMemoryStudentsRepository()

    questionsRepository = new InMemoryQuestionsRepository(
      questionAttachmentsRepository,
      attachmentsRepository,
      studentsRepository,
    )

    answerAttachmentsRepository = new InMemoryAnswerAttachmentsRepository()
    answersRepository = new InMemoryAnswersRepository(
      answerAttachmentsRepository,
    )

    sut = new ChooseQuestionBestAnswerUseCase(
      questionsRepository,
      answersRepository,
    )
  })

  it('should be able to choose the question best answer successfully', async () => {
    const newQuestion = makeQuestion()
    await questionsRepository.create(newQuestion)

    const answer = makeAnswer({
      questionId: newQuestion.id,
    })

    await answersRepository.create(answer)

    const result = (await sut.execute({
      authorId: newQuestion.authorId.toString(),
      answerId: answer.id.toString(),
    })) as Either<null, { question: Question }>

    expect(result.isRight()).toBe(true)
    expect(result.value?.question.bestAnswerId).toEqual(answer.id)
  })

  it('should not be able to choose the question best answer when it not exists', async () => {
    const question = makeQuestion(
      {
        authorId: new UniqueEntityID('author-01'),
      },
      new UniqueEntityID('question-01'),
    )

    await questionsRepository.create(question)

    const result = await sut.execute({
      authorId: 'author-01',
      answerId: 'answer-01',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to choose a question best answer when not exists an question', async () => {
    const answer = makeAnswer(
      {
        authorId: new UniqueEntityID('author-02'),
        questionId: new UniqueEntityID('question-01'),
        content: 'Answer content',
      },
      new UniqueEntityID('answer-01'),
    )

    await answersRepository.create(answer)

    const result = await sut.execute({
      authorId: 'author-01',
      answerId: 'answer-01',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to choose a question best answer when the question is not from the author', async () => {
    const newQuestion = makeQuestion({
      authorId: new UniqueEntityID('author-01'),
    })

    await questionsRepository.create(newQuestion)

    const answer = makeAnswer(
      {
        authorId: new UniqueEntityID('author-02'),
        questionId: newQuestion.id,
        content: 'Answer content',
      },
      new UniqueEntityID('answer-01'),
    )

    await answersRepository.create(answer)

    const result = await sut.execute({
      authorId: 'author-02',
      answerId: 'answer-01',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
