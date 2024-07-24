import request from 'supertest'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { INestApplication } from '@nestjs/common'

import { AppModule } from '@/infra/app.module'
import { StudentFactory } from 'test/factories/make-student'
import { QuestionFactory } from 'test/factories/make-question'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { QuestionCommentFactory } from 'test/factories/make-question-comment'

describe('Delete question comment (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let questionCommentFactory: QuestionCommentFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory, QuestionCommentFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    questionCommentFactory = moduleRef.get(QuestionCommentFactory)

    await app.init()
  })

  test('[DELETE] /questions/comment/:commentId', async () => {
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

    const questionComment =
      await questionCommentFactory.makePrismaQuestionComment({
        authorId: id,
        questionId: newQuestion.id,
      })

    const response = await request(app.getHttpServer())
      .delete(`/questions/comments/${questionComment.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    const comment = await prisma.comment.findUnique({
      where: {
        id: questionComment.id.toString(),
      },
    })

    expect(response.statusCode).toBe(204)
    expect(comment).toBeNull()
  })

  afterAll(async () => {
    await app.close()
  })
})
