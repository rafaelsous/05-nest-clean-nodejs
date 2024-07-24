import { FakeHasher } from 'test/criptography/fake-hasher'
import { RegisterStudentUseCase } from './register-student'
import { InMemoryStudentsRepository } from 'test/repositories/in-memory/in-memory-students-repository'

let studentsRepository: InMemoryStudentsRepository
let hashGenerator: FakeHasher
let sut: RegisterStudentUseCase // system under test

describe('Register Student Use Case', () => {
  beforeEach(() => {
    hashGenerator = new FakeHasher()
    studentsRepository = new InMemoryStudentsRepository()

    sut = new RegisterStudentUseCase(studentsRepository, hashGenerator)
  })

  it('should be able to register a new student successfully', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: '123456',
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      student: studentsRepository.students[0],
    })
  })

  it('should be able to hash student password upon registration', async () => {
    const plainPassword = '123456'

    const result = await sut.execute({
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: plainPassword,
    })

    const hashedPassword = await hashGenerator.hash(plainPassword)

    expect(result.isRight()).toBe(true)
    expect(studentsRepository.students[0].password).toBe(hashedPassword)
  })
})
