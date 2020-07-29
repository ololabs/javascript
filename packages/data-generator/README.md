# @olo/data-generator

For mock and demonstration purposes we have created a data generation module, which uses [Chance.js](https://chancejs.com) under the hood. This module allows a consumer to input a value, a count, and a seed for regeneration purposes, and output the value count times. The value must always be presented as a tuple, where the first item in the sequence is the type of data to generate, and the second may be an options object.

Taking the below example, you can see that the tuple we pass has an object for its data type and provides the related options `recurse` and `depth`. This tells the generator to create a set of objects (10 in the example) which have a `key` which is a `guid` value (`guid` utility provided by Chance.js), a `value` which is a `string` (empty string will create a string), a boolean value `maybeObject` (`true` or `false` could be passed here and either one will create a random chance boolean value) and possibly a `subObject` array which can be filled with more objects of a similar shape up to two levels deep and requires `maybeObject` to be true using the `dependency` option. Please note, if recursing, depth is an attribute which _may_ not be adhered to. E.g. because you _can_ recurse two levels deep does not necessitate that the returned value will do so for every value.

Additionally the generator respects options passed to Chance utilities -- any string value it encounters which corresponds to the name of a Chance.js utility will call that utility and be passed the options object as its argument when called.

```jsx
import { generate } from '@olo/design-system-shared/data';
import { Button } from '@olo/design-system-react';

const makeData = () =>
  generate(
    [
      {
        // object to generate
        key: ['guid'],
        value: [''],
        maybeObject: [true],
        subObject: [[], { dependency: 'maybeObject' }],
      },
      {
        // options for object
        recurse: 'subObject',
        depth: 2,
      },
    ],
    10, // number of objects to generate
    Math.random() // seed, so we can randomize the data in this case (or use something predictable to reproduce results)
  );

<Button.Button onclick={() => alert(JSON.stringify(makeData(), null, '\t'))}>Show me some data!</Button.Button>;
```
