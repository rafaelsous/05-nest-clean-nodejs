import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Patch,
} from '@nestjs/common'

import { UserPayload } from '@/infra/auth/jwt.strategy'
import { CurrentUser } from '@/infra/auth/current-user.decorator'
import { ReadNotificationUseCase } from '@/domain/notification/application/use-cases/read-notification'

@Controller('notifications/:notificationId/read')
export class ReadNotificationController {
  constructor(private readNotificationUseCase: ReadNotificationUseCase) {}

  @Patch()
  @HttpCode(204)
  async handle(
    @CurrentUser() user: UserPayload,
    @Param('notificationId') notificationId: string,
  ) {
    const result = await this.readNotificationUseCase.execute({
      recipientId: user.sub,
      notificationId,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }
  }
}
