import Generator, { GenerateSchemaTuple, GenerateValues } from './Generator';

/**
 * A utility used to iterate over a provided schema and create random data using the Chance.js library.
 *
 * @summary Generate all types of mock data.
 *
 * @example
 * // returns { key: <guid>, title: <string Company Name>, isFolder: <bool>, children: <self[] recurses depth times> }
 * generate(
 *   [
 *     {
 *       key: ['guid'],
 *       title: ['company'],
 *       isFolder: [true],
 *       children: [[]],
 *     },
 *     { recurse: 'children', depth: 4 },
 *   ],
 *   70,
 *   'myGeneratedValueSeed' // optional
 * );
 *
 * @param {GenerateSchemaTuple} schema - A schema to generate. Pass anything from a simple number or string value to a complex deep object.
 * @param {number} count - A specified number of rows.
 * @param {*} [seed] - An optional seed for this example (makes the generated result repeatable).
 *
 * @returns {GenerateValues[]}
 */
export function generate(schema: GenerateSchemaTuple, count: number, seed?: any): GenerateValues[] {
  const generator = new Generator(schema, seed);
  return generator.generate(count, 0);
}

export default { generate };
