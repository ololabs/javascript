import Chance from 'chance';

export type ChanceBooleanOptions = { likelihood: number };
export type ChanceOptions =
  | Chance.Options
  | Chance.FalsyOptions
  | Chance.WordOptions
  | Chance.CharacterOptions
  | Chance.StringOptions
  | Chance.UrlOptions
  | Chance.IntegerOptions
  | Chance.FullNameOptions
  | Chance.FirstNameOptions
  | Chance.LastNameOptions
  | Chance.SuffixOptions
  | Chance.PrefixOptions
  | Chance.NameOptions
  | Chance.EmailOptions
  | Chance.SentenceOptions
  | Chance.DateOptions
  | Chance.UniqueOptions<any>
  | ChanceBooleanOptions;

export type ChanceFn = Exclude<keyof Chance.Chance, 'seed'>;

export type GenerateOptions = {
  /** An internal-use option to specify where we are inside our recursive schema, to ensure we don't build past the desired depth. */
  _currentDepth?: number;
  /** The name of the currently processing GenerateSchema value. */
  _name?: string;
  /** An item in the GenerateSchema may have a dependency on another. */
  dependency?: string;
  /** A depth to recurse may be specified. */
  depth?: number;
  /** An item may be specified here, which must be an array in the GenerateSchema, in which to recurse. */
  recurse?: string;
} & Partial<ChanceOptions>;

export type GenerateSchemaArray = Array<GenerateSchema | (never[] & { length: 0 })>;

export type GenerateSchemaObject = {
  [key: string]: GenerateSchemaTuple;
};

export type GenerateSchema =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | GenerateSchemaTuple
  | GenerateSchemaArray
  | GenerateSchemaObject;

export type GenerateSchemaTuple = [GenerateSchema] | [GenerateSchema, GenerateOptions];

export type GenerateValuesObject = {
  [key: string]: GenerateValues;
};

export type GenerateValues =
  | string
  | number
  | boolean
  | null
  | undefined
  | Date
  | GenerateValues[]
  | GenerateValuesObject;

/**
 * @class Generator
 *
 * @param {GenerateSchema} schema
 * @param {GenerateOptions} opts
 * allowed object opts:
 *  - @param {string} [recurse] - the name of a value to recurse upon, which must be an array in the object
 *  - @param {number} [depth] - the number of times to potentially recurse
 * allowed value opts:
 *  - @param {string} [dependency] - the name of a prior generated sibling value to test in order to generate
 * allowed chance.js opts:
 *  - @param {any} [*] - [key: string]: any - settings passed through to Chance.js
 * @param {any} [seed]
 */
export class Generator {
  // Schema is a sample of data
  constructor([schema, opts]: GenerateSchemaTuple, seed?: any) {
    this.generate = this.generate.bind(this);
    this.createSchema = this.createSchema.bind(this);
    this._canGenerate = this._canGenerate.bind(this);

    // optionally, generate values with predictability
    this.chance = new Chance(seed);
    // our first item to generate
    this.schema = schema;
    // the options for that item
    this.opts = opts || ({} as GenerateOptions);

    return this;
  }

  chance: Chance.Chance;
  schema: GenerateSchema;
  opts: GenerateOptions;

  generate(count: number, depth: number): GenerateValues[] {
    if (count <= 0) return [];

    return [...Array(count)].map(() => this.createSchema([this.schema, this.opts], { _currentDepth: depth }));
  }

  createSchema([schema, opts]: GenerateSchemaTuple, objectOpts: GenerateOptions): GenerateValues {
    switch (typeof schema) {
      case 'boolean':
        // { likelihood: 0-100 }
        return this.chance.bool(opts as ChanceBooleanOptions);
      case 'number':
        // escape for NaN
        if (isNaN(schema)) {
          // { pool: [ ...values ] }
          return this.chance.falsy(opts as Chance.FalsyOptions);
        }
        if (schema < 0) {
          // { min: number, max: number }
          return this.chance.integer(opts as Partial<Chance.IntegerOptions>);
        }
        // { min: number, max: number, exclusions: [ ...values ] }
        return this.chance.natural(opts);
      case 'string':
        /**
         * export type ChanceWithFnType = Chance.Chance | {
         *   [key in keyof ChanceFn]: (...args: any[]) => any;
         * };
         *
         * export type ChanceWithFnTypeFn = keyof ChanceWithFnType;
         *
         * Typing `schema as ChanceWithFnTypeFn` below should be the appropriate override to resolve to a callable type,
         * but it errors with "This expression is not callable. Type 'never' has no call signatures." so the best
         * resolution was to bring that type inline when invoking the requested method.
         */
        if (this.chance[schema as ChanceFn]) {
          // https://chancejs.com/index.html
          return (this.chance[schema as ChanceFn] as (...args: any) => any)(opts);
        }
        // { length: number, pool: string, alpha: boolean, casing: upper | lower, symbols: boolean }
        return this.chance.string(opts as Partial<Chance.StringOptions>);
      case 'object':
        // null can't be iterated over
        if (schema === null) {
          // { pool: [ ...values ] }
          return this.chance.falsy(opts as Chance.FalsyOptions);
        }

        // we could have a date here
        if (Object.prototype.toString.call(schema) === '[object Date]') {
          // { string: boolean, american: boolean }
          return this.chance.date(opts as Chance.DateOptions);
        }

        // we could also have an array
        if (Object.prototype.toString.call(schema) === '[object Array]') {
          // if recursion is set, iterate over that depth times
          if (
            objectOpts &&
            objectOpts.recurse && // must be recursing
            objectOpts.recurse === objectOpts._name && // we must be on the proper key to recurse
            objectOpts._currentDepth !== undefined && // must be set -- 0 is still a valid truthy value here
            objectOpts._currentDepth !== null &&
            this.opts.depth && // we need to be sure these values are set before checking them
            objectOpts._currentDepth < this.opts.depth
          ) {
            return this.generate(this.chance.natural({ min: 0, max: this.opts.depth }), objectOpts._currentDepth + 1);
          }

          // otherwise create the deeply nested object, wrapping each item in an array to ensure we don't break the schema
          return (schema as GenerateSchemaTuple[]).map((s) => this.createSchema([s, {}], opts as GenerateOptions));
        }

        // we are dealing with generating an object of values, so iterate through them and (if we can) re-run this method over them
        const val: GenerateValuesObject = {};
        let prop: keyof GenerateSchemaObject;
        for (prop in schema) {
          if (schema.hasOwnProperty(prop) && this._canGenerate(val, schema as GenerateSchemaObject, prop)) {
            val[prop] = this.createSchema((schema as GenerateSchemaObject)[prop], {
              ...opts,
              _name: prop,
              _currentDepth: objectOpts._currentDepth,
            });
          }
        }
        return val;
      default:
        // { pool: [ ...values ] }
        return this.chance.falsy(opts as Chance.FalsyOptions);
    }
  }

  /**
   * We want to ensure that each item can be judged based upon other elements in the object (generated prior to it)
   * so we offer a `dependency` option which can be the key name of a previously generated element. If that value is
   * truthy, the element under scrutiny may be generated.
   */
  _canGenerate(val: GenerateValuesObject, schema: GenerateSchemaObject, prop: string): boolean {
    // we can only do this because we've already asserted schema.hasOwnProperty(prop)
    const [, nextOpts] = schema[prop];
    const deps = nextOpts && nextOpts.dependency;

    // either we don't have a dependency and so let the item generate, or we return the value of that dependency
    return !!(!deps || val[deps]);
  }
}

export default Generator;
