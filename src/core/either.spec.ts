import { Either, left, right } from './either'

function doSomething(isSuccess: boolean): Either<string, number> {
  if (isSuccess) {
    return right(10)
  } else {
    return left('failure')
  }
}

test('success', () => {
  const result = doSomething(true)

  expect(result.isRight()).toBe(true)
  expect(result.isLeft()).toBe(false)
})

test('failure', () => {
  const result = doSomething(false)

  expect(result.isLeft()).toBe(true)
  expect(result.isRight()).toBe(false)
})
