import request from 'supertest'
import { Test } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { INestApplication } from '@nestjs/common'

import { AppModule } from '@/infra/app.module'
import { StudentFactory } from 'test/factories/make-student'
import { DatabaseModule } from '@/infra/database/database.module'
import { NotificationFactory } from 'test/factories/make-notification'
import { PrismaService } from '@/infra/database/prisma/prisma.service'

describe('Read Notification (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService
  let studentFactory: StudentFactory
  let notificationFactory: NotificationFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, NotificationFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    notificationFactory = moduleRef.get(NotificationFactory)

    await app.init()
  })

  test('[PATCH] /notifications/:notificationId/read', async () => {
    const student = await studentFactory.makePrismaStudent({ name: 'John Doe' })

    const accessToken = jwt.sign({
      sub: student.id.toString(),
    })

    const newNotification = await notificationFactory.makePrismaNotification({
      recipientId: student.id,
      title: 'Notification title',
      content: 'Notification content',
      createdAt: new Date(),
    })

    const notificationId = newNotification.id.toString()

    const response = await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    const notification = await prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
    })

    expect(response.statusCode).toBe(204)
    expect(notification?.readAt).toEqual(expect.any(Date))
  })

  afterAll(async () => {
    await app.close()
  })
})
