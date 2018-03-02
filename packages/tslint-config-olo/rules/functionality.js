module.exports = {
  'rules': {
    'ban': false,
    'curly': true,
    'forin': true,
    'label-position': true,
    'no-arg': true,
    'no-bitwise': true,
    'no-conditional-assignment': true,
    'no-console': true,
    'no-construct': true,
    'no-debugger': true,
    'no-duplicate-variable': true,
    'no-eval': true,
    'no-invalid-this': true,
    'no-null-keyword': true,
    'no-shadowed-variable': [true, {
		'temporal-dead-zone': false,
		"class": false,
		"enum": false,
		"function": false,
		"interface": false,
		"namespace": false,
		"typeAlias": false,
		"typeParameter": false,
		"import": false
	}],
    'no-string-literal': false,
    'no-switch-case-fall-through': true,
    "no-unused-expression": [true, 'allow-fast-null-checks', 'allow-new', 'allow-tagged-template'],
    'no-unused-variable': [true, 'react', { 'ignore-pattern': 'React' }],
    'no-use-before-declare': true,
    'no-var-keyword': true,
    'radix': true,
    'switch-default': true,
    'triple-equals': true,
    'use-isnan': true
  }
};
