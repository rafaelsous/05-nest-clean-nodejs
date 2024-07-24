import { describe, expect, it } from 'vitest'

import { Slug } from './slug'

describe('Slug Value Objects', () => {
  it('should be able to create a slug', () => {
    const slug = Slug.createFromText('Faça um _ texto bem legal!')

    expect(slug.value).toEqual('faca-um-texto-bem-legal')
  })
})
