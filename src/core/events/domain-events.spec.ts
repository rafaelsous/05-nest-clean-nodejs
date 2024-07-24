import { AggregateRoot } from '../entities/aggregate-root'
import { UniqueEntityID } from '../entities/unique-entity-id'
import { DomainEvent } from './domain-event'
import { DomainEvents } from './domain-events'

class CustomAggregateCreated implements DomainEvent {
  private aggregate: CustomAggregate // eslint-disable-line
  public ocurredAt: Date

  constructor(aggregate: CustomAggregate) {
    this.ocurredAt = new Date()
    this.aggregate = aggregate
  }

  public getAggregateId(): UniqueEntityID {
    return this.aggregate.id
  }
}

class CustomAggregate extends AggregateRoot<null> {
  static created() {
    const aggregate = new CustomAggregate(null)

    aggregate.addDomainEvent(new CustomAggregateCreated(aggregate))

    return aggregate
  }
}

describe('Domain Events', () => {
  it('should be able to dispatch and listen to domain events', () => {
    const callbackSpy = vi.fn()

    // Registrando subscriber (ouvindo o evento "resposta criada", por exemplo)
    DomainEvents.register(callbackSpy, CustomAggregateCreated.name)

    // Criando uma nova resposta
    const aggregate = CustomAggregate.created()

    // Verificando se o evento foi à lista de eventos registrados
    expect(aggregate.domainEvents).toHaveLength(1)

    // Disparando o evento após salvar a nova resposta no banco de dados
    DomainEvents.dispatchEventsForAggregate(aggregate.id)

    // Verificando se a função do evento foi disparada
    expect(callbackSpy).toHaveBeenCalledTimes(1)

    // Verificando se o evento foi removido da lista de eventos
    expect(aggregate.domainEvents).toHaveLength(0)
  })
})
