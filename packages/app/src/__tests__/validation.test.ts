import { isValidEmail } from '../utils/validation'

describe('isValidEmail', () => {
  const validEmails = [
    'user@example.com',
    'john.doe@domain.org',
    'test+tag@company.co',
    'name@sub.domain.com',
    'user123@test.io',
    'first.last@workplace.net',
    'a@b.co',
  ]

  const invalidEmails = [
    '',
    'plaintext',
    '@no-local.com',
    'user@',
    'user@.com',
    'user@domain',
    'user @example.com',
    'user@exam ple.com',
    '@',
    'user@@example.com',
    'user@example..com',
  ]

  it.each(validEmails)('should return true for valid email: %s', (email) => {
    expect(isValidEmail(email)).toBe(true)
  })

  it.each(invalidEmails)('should return false for invalid email: "%s"', (email) => {
    expect(isValidEmail(email)).toBe(false)
  })
})
