import {
  and,
  between,
  or,
  sequence,
  split
} from '@mona/combinators'

import {
  delay,
  label,
  map,
  token,
  value
} from '@mona/core'

import {
  float
} from '@mona/numbers'

import {
  parse
} from '@mona/parse'

import {
  digit,
  oneOf,
  noneOf,
  string as str,
  text,
  trim
} from '@mona/strings'

/*
 * JSON in JS, without eval(), with nice error reporting.
 *
 * Implements the grammar as described in http://www.json.org/
 */
export function parseJSON (text) {
  return parse(json(), text)
}

export function json () {
  return trim(or(object(), array(), bool(), nil(), string(), number()))
}

function object () {
  return map(pairs => {
    let obj = {}
    pairs.forEach(p => {
      obj[p[0]] = p[1]
    })
    return obj
  }, between(trim(str('{')),
             trim(str('}')),
             split(keyAndValue(), trim(str(',')))))
}

function keyAndValue () {
  return sequence(s => {
    const key = s(string())
    s(trim(str(':')))
    const val = s(json())
    return value([key, val])
  })
}

function array () {
  return between(trim(str('[')),
                 trim(str(']')),
                 split(delay(json),
                       trim(str(','))))
}

function bool () {
  return map(str => str === 'true',
             or(str('true'),
                str('false'),
                'boolean'))
}

function nil () {
  return label(and(str('null'), value(null)), 'null')
}

function number () {
  return float()
}

function string () {
  return between(str('"'),
                 label(str('"'), 'closing double-quote'),
                 text(or(escaped(), noneOf('"'))))
}

function escaped () {
  return and(str('\\'),
             or(simpleEscape(),
                unicodeHex(),
                token()))
}

var escapeTable = {b: '\b', f: '\f', n: '\n', r: '\r', t: '\t'}
function simpleEscape () {
  return map(x => escapeTable[x], oneOf('bfnrt'))
}

function unicodeHex () {
  return map(digits => String.fromCharCode('0x' + digits),
             and(str('u'),
                 text(digit(16), {min: 4, max: 4})))
}
