import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

export interface AttachmentProps {
  title: string
  url: string
}

export class Attachment extends Entity<AttachmentProps> {
  static create(props: AttachmentProps, id?: UniqueEntityID) {
    const attachment = new Attachment(props, id)

    return attachment
  }

  get title() {
    return this.props.title
  }

  get url() {
    return this.props.url
  }

  set title(title: string) {
    this.props.title = title
  }

  set url(url: string) {
    this.props.url = url
  }
}
