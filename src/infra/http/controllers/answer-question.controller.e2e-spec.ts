import request from 'supertest'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { INestApplication } from '@nestjs/common'

import { AppModule } from '@/infra/app.module'
import { StudentFactory } from 'test/factories/make-student'
import { QuestionFactory } from 'test/factories/make-question'
import { DatabaseModule } from '@/infra/database/database.module'
import { AttachmentFactory } from 'test/factories/make-attachment'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Answer question (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let attachmentFactory: AttachmentFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory, AttachmentFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)

    await app.init()
  })

  test('[POST] /questions/:questionId/answers', async () => {
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

    const attachment1 = await attachmentFactory.makePrismaAttachment()
    const attachment2 = await attachmentFactory.makePrismaAttachment()

    const answerContent = 'New answer content'

    const response = await request(app.getHttpServer())
      .post(`/questions/${newQuestion.id}/answers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: answerContent,
        attachments: [attachment1.id.toString(), attachment2.id.toString()],
      })

    const answer = await prisma.answer.findFirst({
      where: {
        questionId: newQuestion.id.toString(),
      },
    })

    const attachments = await prisma.attachment.findMany({
      where: {
        answerId: answer?.id.toString(),
      },
    })

    expect(response.statusCode).toBe(201)
    expect(answer).toEqual(
      expect.objectContaining({
        content: answerContent,
      }),
    )
    expect(attachments).toHaveLength(2)
  })

  afterAll(async () => {
    await app.close()
  })
})
