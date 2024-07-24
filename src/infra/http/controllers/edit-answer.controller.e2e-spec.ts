import request from 'supertest'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { INestApplication } from '@nestjs/common'

import { AppModule } from '@/infra/app.module'
import { AnswerFactory } from 'test/factories/make-answer'
import { StudentFactory } from 'test/factories/make-student'
import { QuestionFactory } from 'test/factories/make-question'
import { DatabaseModule } from '@/infra/database/database.module'
import { AttachmentFactory } from 'test/factories/make-attachment'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { AnswerAttachmentFactory } from 'test/factories/make-answer-attachment'

describe('Edit answer (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let answerFactory: AnswerFactory
  let attachmentFactory: AttachmentFactory
  let answerAttachmentFactory: AnswerAttachmentFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AnswerFactory,
        AttachmentFactory,
        AnswerAttachmentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    answerFactory = moduleRef.get(AnswerFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    answerAttachmentFactory = moduleRef.get(AnswerAttachmentFactory)

    await app.init()
  })

  test('[PUT] /answers/:id', async () => {
    const { id } = await studentFactory.makePrismaStudent({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: '123456',
    })

    const accessToken = jwt.sign({
      sub: id.toString(),
    })

    const attachment1 = await attachmentFactory.makePrismaAttachment()
    const attachment2 = await attachmentFactory.makePrismaAttachment()

    const question = await questionFactory.makePrismaQuestion({
      authorId: id,
    })

    const newAnswer = await answerFactory.makePrismaAnswer({
      authorId: id,
      questionId: question.id,
    })

    await answerAttachmentFactory.makePrismaAnswerAttachment({
      answerId: newAnswer.id,
      attachmentId: attachment1.id,
    })

    await answerAttachmentFactory.makePrismaAnswerAttachment({
      answerId: newAnswer.id,
      attachmentId: attachment2.id,
    })

    const editedAnswerContent = 'Edited answer content'
    const attachment3 = await attachmentFactory.makePrismaAttachment()

    const response = await request(app.getHttpServer())
      .put(`/answers/${newAnswer.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: editedAnswerContent,
        attachments: [attachment1.id.toString(), attachment3.id.toString()],
      })

    const answer = await prisma.answer.findUnique({
      where: {
        id: newAnswer.id.toString(),
      },
    })

    const attachments = await prisma.attachment.findMany({
      where: {
        answerId: answer?.id.toString(),
      },
    })

    expect(response.statusCode).toBe(204)
    expect(answer).toEqual(
      expect.objectContaining({
        content: editedAnswerContent,
      }),
    )
    expect(attachments).toHaveLength(2)
    expect(attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: attachment1.id.toString() }),
        expect.objectContaining({ id: attachment3.id.toString() }),
      ]),
    )
  })

  afterAll(async () => {
    await app.close()
  })
})
