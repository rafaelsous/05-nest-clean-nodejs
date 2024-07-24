import { makeStudent } from 'test/factories/make-student'
import { FakeHasher } from 'test/criptography/fake-hasher'
import { FakeEncrypter } from 'test/criptography/fake-encrypter'
import { AuthenticateStudentUseCase } from './authenticate-student'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory/in-memory-students-repository'

let studentsRepository: InMemoryStudentsRepository
let fakeHasher: FakeHasher
let encrypter: FakeEncrypter
let sut: AuthenticateStudentUseCase // system under test

describe('Authenticate Student Use Case', () => {
  beforeEach(() => {
    fakeHasher = new FakeHasher()
    encrypter = new FakeEncrypter()
    studentsRepository = new InMemoryStudentsRepository()

    sut = new AuthenticateStudentUseCase(
      studentsRepository,
      fakeHasher,
      encrypter,
    )
  })

  it('should be able to authenticate a student successfully', async () => {
    const plainPassword = '123456'
    const hashedPassword = await fakeHasher.hash(plainPassword)

    const newStudent = makeStudent({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: hashedPassword,
    })

    await studentsRepository.create(newStudent)

    const result = await sut.execute({
      email: newStudent.email,
      password: plainPassword,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      accessToken: expect.any(String),
    })
  })

  it('should not be able to authenticate a student when it does not exist', async () => {
    const result = await sut.execute({
      email: 'inexistent-student@email.com',
      password: '123456',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })

  it('should not be able to authenticate a student with wrong credentials', async () => {
    const plainPassword = '123456'
    const hashedPassword = await fakeHasher.hash(plainPassword)

    const newStudent = makeStudent({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: hashedPassword,
    })

    await studentsRepository.create(newStudent)

    const result = await sut.execute({
      email: newStudent.email,
      password: 'wrong-password',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(WrongCredentialsError)
  })
})
