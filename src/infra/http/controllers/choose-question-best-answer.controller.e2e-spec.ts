import request from 'supertest'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { INestApplication } from '@nestjs/common'

import { AppModule } from '@/infra/app.module'
import { StudentFactory } from 'test/factories/make-student'
import { QuestionFactory } from 'test/factories/make-question'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AnswerFactory } from 'test/factories/make-answer'

describe('Choose question best answer (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let answerFactory: AnswerFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory, AnswerFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    answerFactory = moduleRef.get(AnswerFactory)

    await app.init()
  })

  test('[PATCH] /answers/:answerId/choose-as-best', async () => {
    const { id } = await studentFactory.makePrismaStudent({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: '123456',
    })

    const accessToken = jwt.sign({
      sub: id.toString(),
    })

    const newQuestion = await questionFactory.makePrismaQuestion({
      authorId: id,
    })

    const answer = await answerFactory.makePrismaAnswer({
      authorId: id,
      questionId: newQuestion.id,
    })

    const response = await request(app.getHttpServer())
      .patch(`/answers/${answer.id}/choose-as-best`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    const question = await prisma.question.findUnique({
      where: {
        id: newQuestion.id.toString(),
      },
    })

    expect(response.statusCode).toBe(204)
    expect(question?.bestAnswerId).toBeTruthy()
    expect(question?.bestAnswerId).toEqual(answer.id.toString())
  })

  afterAll(async () => {
    await app.close()
  })
})
