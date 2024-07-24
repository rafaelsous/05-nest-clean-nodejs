import request from 'supertest'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { INestApplication } from '@nestjs/common'

import { AppModule } from '@/infra/app.module'
import { StudentFactory } from 'test/factories/make-student'
import { AnswerFactory } from 'test/factories/make-answer'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AnswerCommentFactory } from 'test/factories/make-answer-comment'
import { QuestionFactory } from 'test/factories/make-question'

describe('Comment on answer (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let answerFactory: AnswerFactory
  let answerCommentFactory: AnswerCommentFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AnswerFactory,
        AnswerCommentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    answerFactory = moduleRef.get(AnswerFactory)
    answerCommentFactory = moduleRef.get(AnswerCommentFactory)

    await app.init()
  })

  test('[POST] /answers/:answerId/comments', async () => {
    const { id } = await studentFactory.makePrismaStudent({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: '123456',
    })

    const accessToken = jwt.sign({
      sub: id.toString(),
    })

    const question = await questionFactory.makePrismaQuestion({
      authorId: id,
    })

    const newAnswer = await answerFactory.makePrismaAnswer({
      authorId: id,
      questionId: question.id,
    })

    const commentContent = 'New comment content'

    const answerComment = await answerCommentFactory.makePrismaAnswerComment({
      authorId: id,
      answerId: newAnswer.id,
      content: commentContent,
    })

    const response = await request(app.getHttpServer())
      .post(`/answers/${newAnswer.id}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: commentContent,
      })

    const comment = await prisma.comment.findUnique({
      where: {
        id: answerComment.id.toString(),
      },
    })

    expect(response.statusCode).toBe(201)
    expect(comment?.answerId).toBeTruthy()
    expect(comment?.answerId).toEqual(newAnswer.id.toString())
  })

  afterAll(async () => {
    await app.close()
  })
})
