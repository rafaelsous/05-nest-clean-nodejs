import request from 'supertest'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { INestApplication } from '@nestjs/common'

import { AppModule } from '@/infra/app.module'
import { StudentFactory } from 'test/factories/make-student'
import { QuestionFactory } from 'test/factories/make-question'
import { DatabaseModule } from '@/infra/database/database.module'
import { AttachmentFactory } from 'test/factories/make-attachment'
import { Slug } from '@/domain/forum/enterprise/entities/value-objects/slug'
import { QuestionAttachmentFactory } from 'test/factories/make-question-attachment'

describe('Get Question By Slug (E2E)', () => {
  let app: INestApplication
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
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    questionAttachmentFactory = moduleRef.get(QuestionAttachmentFactory)

    await app.init()
  })

  test('[GET] /questions/:slug', async () => {
    const student = await studentFactory.makePrismaStudent({ name: 'John Doe' })

    const accessToken = jwt.sign({
      sub: student.id.toString(),
    })

    const question = await questionFactory.makePrismaQuestion({
      authorId: student.id,
      slug: Slug.create('new-question-slug-1'),
    })

    const attachment = await attachmentFactory.makePrismaAttachment({
      title: 'attachment title',
    })

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      questionId: question.id,
      attachmentId: attachment.id,
    })

    const response = await request(app.getHttpServer())
      .get('/questions/new-question-slug-1')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      question: expect.objectContaining({
        slug: question.slug.value,
        author: student.name,
        attachments: [
          expect.objectContaining({
            id: attachment.id.toString(),
            title: attachment.title,
          }),
        ],
      }),
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
