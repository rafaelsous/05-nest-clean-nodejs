import { Either } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { makeNotification } from 'test/factories/make-notification'
import { InMemoryNotificationsRepository } from 'test/repositories/in-memory/in-memory-notifications-repository'
import { Notification } from '../../enterprise/entities/notification'
import { ReadNotificationUseCase } from './read-notification'

let notificationsRepository: InMemoryNotificationsRepository
let sut: ReadNotificationUseCase // system under test

describe('Read Notification Use Case', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository()

    sut = new ReadNotificationUseCase(notificationsRepository)
  })

  it('should be able to read a notification successfully', async () => {
    const notification = makeNotification()

    await notificationsRepository.create(notification)

    const result = (await sut.execute({
      recipientId: notification.recipientId.toString(),
      notificationId: notification.id.toString(),
    })) as Either<null, { notification: Notification }>

    expect(result.isRight()).toBe(true)
    expect(result.value?.notification.readAt).toEqual(expect.any(Date))
  })

  it('should not be able to read a notification when it not exists', async () => {
    const result = await sut.execute({
      recipientId: 'recipient-01',
      notificationId: 'notification-01',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to read a notification from another recipient', async () => {
    const notification = makeNotification(
      {
        recipientId: new UniqueEntityID('recipient-01'),
      },
      new UniqueEntityID('notification-01'),
    )

    await notificationsRepository.create(notification)

    const result = await sut.execute({
      recipientId: 'another-recipient-id',
      notificationId: notification.id.toString(),
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
