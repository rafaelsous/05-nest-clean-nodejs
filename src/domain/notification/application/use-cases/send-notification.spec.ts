import { InMemoryNotificationsRepository } from 'test/repositories/in-memory/in-memory-notifications-repository'
import { SendNotificationUseCase } from './send-notification'

let notificationsRepository: InMemoryNotificationsRepository
let sut: SendNotificationUseCase // system under test

describe('Send Notification Use Case', () => {
  beforeEach(() => {
    notificationsRepository = new InMemoryNotificationsRepository()

    sut = new SendNotificationUseCase(notificationsRepository)
  })

  it('should be able to send a new notification successfully', async () => {
    const result = await sut.execute({
      recipientId: 'recipient-1',
      title: 'Notification title',
      content: 'Notification content',
    })

    expect(result.isRight()).toBe(true)
    expect(notificationsRepository.notifications[0]).toEqual(
      result.value?.notification,
    )
  })
})
