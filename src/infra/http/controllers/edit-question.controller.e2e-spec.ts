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
import { QuestionAttachmentFactory } from 'test/factories/make-question-attachment'

describe('Edit question (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let attachmentFactory: AttachmentFactory
  let questionAttachmentFactory: QuestionAttachmentFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AttachmentFactory,
        QuestionAttachmentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    questionAttachmentFactory = moduleRef.get(QuestionAttachmentFactory)

    await app.init()
  })

  test('[PUT] /questions/:id', async () => {
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

    const newQuestion = await questionFactory.makePrismaQuestion({
      authorId: id,
    })

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      questionId: newQuestion.id,
      attachmentId: attachment1.id,
    })

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      questionId: newQuestion.id,
      attachmentId: attachment2.id,
    })

    const editedQuestionTitle = 'Edited question title'
    const editedQuestionContent = 'Edited question content'
    const attachment3 = await attachmentFactory.makePrismaAttachment()

    const response = await request(app.getHttpServer())
      .put(`/questions/${newQuestion.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: editedQuestionTitle,
        content: editedQuestionContent,
        attachments: [attachment1.id.toString(), attachment3.id.toString()],
      })

    const question = await prisma.question.findFirst({
      where: {
        title: editedQuestionTitle,
      },
    })

    const attachments = await prisma.attachment.findMany({
      where: {
        questionId: question?.id.toString(),
      },
    })

    expect(response.statusCode).toBe(204)
    expect(question).toEqual(
      expect.objectContaining({
        title: editedQuestionTitle,
        content: editedQuestionContent,
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
