import request from 'supertest'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { INestApplication } from '@nestjs/common'

import { waitFor } from 'test/utils/wait-for'
import { AppModule } from '@/infra/app.module'
import { DomainEvents } from '@/core/events/domain-events'
import { StudentFactory } from 'test/factories/make-student'
import { QuestionFactory } from 'test/factories/make-question'
import { DatabaseModule } from '@/infra/database/database.module'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('On answer created (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)

    DomainEvents.shouldRun = true

    await app.init()
  })

  it('should send a notification when an answer is created', async () => {
    const student = await studentFactory.makePrismaStudent({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: '123456',
    })

    const accessToken = jwt.sign({
      sub: student.id.toString(),
    })

    const newQuestion = await questionFactory.makePrismaQuestion({
      authorId: student.id,
    })

    const answerContent = 'New answer content'

    await request(app.getHttpServer())
      .post(`/questions/${newQuestion.id}/answers`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: answerContent,
        attachments: [],
      })

    await waitFor(async () => {
      const notification = await prisma.notification.findFirst({
        where: {
          recipientId: student.id.toString(),
        },
      })

      expect(notification).not.toBeNull()
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
