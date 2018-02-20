import test from 'ava'
import * as token from './token'

test('unit: tokenRegex', t => {
  t.true(token.tokenRegex().test('foo:bar'))
  t.true(token.tokenRegex().test('-foo:bar'))
  t.true(token.tokenRegex().test('foo:bar_baz.qux'))
  t.true(token.tokenRegex().test('foo_bar.baz:qux'))
  t.true(token.tokenRegex().test('foo_bar.baz:<=1'))
  t.true(token.tokenRegex().test('foo:"bar"'))
  t.true(token.tokenRegex().test('foo:"bar baz"'))
  t.true(token.tokenRegex().test('foo:"bar baz qux"'))
  t.true(token.tokenRegex().test('foo:" "'))
  t.true(token.tokenRegex().test('foo:>1'))
  t.true(token.tokenRegex().test('foo:>=1'))
  t.true(token.tokenRegex().test('foo:bar*'))
  t.true(token.tokenRegex().test('foo:"bar*"'))
  t.true(token.tokenRegex().test('foo:"bar baz*"'))
  t.true(token.tokenRegex().test('foo:" "'))
  t.false(token.tokenRegex().test('foo'))
  t.false(token.tokenRegex().test('foo:'))
  t.false(token.tokenRegex().test('foo:*'))
  t.false(token.tokenRegex().test('foo::'))
  t.false(token.tokenRegex().test('foo:""'))
  // TODO: figure this out in regex if necessary
  // t.false(token.tokenRegex().test('foo:bar:baz'))
})

test('unit: parseToken', t => {
  t.deepEqual(token.parseToken([]), {})
  t.is(token.parseToken('foo:bar').fullToken, 'foo:bar')
  t.is(token.parseToken('foo:bar').attributeName, 'foo')
  t.true(token.parseToken('foo:bar*').wildcard)
  t.deepEqual(token.parseToken('-foo_bar.baz:>="qux"'), {
    fullToken: '-foo_bar.baz:>="qux"',
    attributeName: 'foo_bar.baz',
    attributeValue: 'qux',
    prepended: '-',
    operator: '>=',
    negated: true,
    quoted: true,
    wildcard: false
  })
})

test('unit: serializeToken', t => {
  t.is(token.serializeToken({
    attributeName: 'foo',
    attributeValue: 'bar',
    prepended: '-',
    operator: '>='
  }), '-foo:>=bar')
})

test('unit: extractTokens', t => {
  t.deepEqual(token.extractTokens('http.method:PUT (level:error OR level:debug)'), [
    [0, 15],
    [17, 28],
    [32, 43]
  ])
  t.deepEqual(token.extractTokens(`keyword1 (level:error AND heroku.source:"foo bar") keyword2 http.method:POST\n\t(-level:info OR http_response.status:>=400)\nkeyword3 invalid:token heroku.dyno_id:abc*`), [
    [10, 21],
    [26, 49],
    [60, 76],
    [79, 90],
    [94, 120],
    [131, 144],
    [145, 164]
  ])
  t.deepEqual(token.extractTokens('level:debug (foo:bar OR level:critical) level:foobar', [
    { name: 'level', enumerations: ['debug', 'critical'] }
  ]), [
    [0, 11],
    [24, 38]
  ])
})