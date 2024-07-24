import request from 'supertest'
import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'

import { JwtService } from '@nestjs/jwt'
import { AppModule } from '@/infra/app.module'
import { StudentFactory } from 'test/factories/make-student'
import { QuestionFactory } from 'test/factories/make-question'
import { DatabaseModule } from '@/infra/database/database.module'
import { Slug } from '@/domain/forum/enterprise/entities/value-objects/slug'

describe('Fetch recent questions (E2E)', () => {
  let app: INestApplication
  let jwt: JwtService
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule],
      providers: [StudentFactory, QuestionFactory],
    }).compile()

    app = moduleRef.createNestApplication()
    jwt = moduleRef.get(JwtService)
    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)

    await app.init()
  })

  test('[GET] /questions', async () => {
    const { id } = await studentFactory.makePrismaStudent({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: '123456',
    })

    const accessToken = jwt.sign({
      sub: id.toString(),
    })

    await Promise.all([
      questionFactory.makePrismaQuestion({
        authorId: id,
        title: 'New question title 1',
        content: 'New question content 1',
        slug: Slug.create('new-question-slug-1'),
      }),
      questionFactory.makePrismaQuestion({
        authorId: id,
        title: 'New question title 2',
        content: 'New question content 2',
        slug: Slug.create('new-question-slug-2'),
      }),
      questionFactory.makePrismaQuestion({
        authorId: id,
        title: 'New question title 3',
        content: 'New question content 3',
        slug: Slug.create('new-question-slug-3'),
      }),
    ])

    const response = await request(app.getHttpServer())
      .get('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body.questions).toHaveLength(3)
    expect(response.body).toEqual({
      questions: expect.arrayContaining([
        expect.objectContaining({ slug: 'new-question-slug-3' }),
        expect.objectContaining({ slug: 'new-question-slug-2' }),
        expect.objectContaining({ slug: 'new-question-slug-1' }),
      ]),
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
