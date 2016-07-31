module.exports = {
  'rules': {
    'member-access': false,
    'member-ordering': false,
    'no-any': false,
    'no-inferrable-types': true,
    'no-internal-module': true,
    'no-namespace': true,
    'no-reference': true,
    'no-var-requires': true,
    'typedef': false,
    'typedef-whitespace': [
      true,
      {
        'call-signature': 'nospace',
        'index-signature': 'nospace',
        'parameter': 'nospace',
        'property-declaration': 'nospace',
        'variable-declaration': 'nospace'
      },
      {
        'call-signature': 'onespace',
        'index-signature': 'onespace',
        'parameter': 'onespace',
        'property-declaration': 'onespace',
        'variable-declaration': 'onespace'
      }
    ]
  }
};