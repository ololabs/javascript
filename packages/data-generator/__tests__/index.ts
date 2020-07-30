import Chance from 'chance';
import { assertTruthy } from '../test-utils';
import { generate } from '../index';

describe('Data generator', () => {
  const MAX = 9007199254740991;
  const MIN = -9007199254740991;

  it('should generate an array of data as long as the second argument', () => {
    const n = 10;
    const arr = generate([''], n, 'lengthSeed');
    expect(arr.length).toBe(n);
    arr.forEach((a) => expect(typeof a).toBe('string'));
  });

  describe('generate the type of data present in the first item of each array tuple', () => {
    it('will generate a boolean using true or false as input', () => {
      const trueArr = generate([true], 1, 'trueSeed');
      expect(trueArr.length).toBe(1);
      trueArr.forEach((a) => expect(typeof a).toBe('boolean'));
      const falseArr = generate([false], 1, 'falseSeed');
      expect(falseArr.length).toBe(1);
      falseArr.forEach((a) => expect(typeof a).toBe('boolean'));
    });

    it('will generate a falsy value if NaN is input', () => {
      const arr = generate([NaN], 1, 'nanSeed');
      expect(arr.length).toBe(1);
      arr.forEach((a) => expect(a).toBeFalsy());
    });

    it('will return an integer (chance for negative number) if a number less than zero is input', () => {
      const arr = generate([-30], 1, 'intSeed');
      expect(arr.length).toBe(1);
      arr.forEach((a) => expect(typeof a).toBe('number'));
      arr.forEach((a) => expect(a).toBeLessThanOrEqual(MAX));
      arr.forEach((a) => expect(a).toBeGreaterThanOrEqual(MIN));
    });

    it('will return a natural number if a number greater than or equal to zero is input', () => {
      const arr = generate([30], 1, 'natSeed');
      expect(arr.length).toBe(1);
      arr.forEach((a) => expect(typeof a).toBe('number'));
      arr.forEach((a) => expect(a).toBeLessThanOrEqual(MAX));
      arr.forEach((a) => expect(a).toBeGreaterThanOrEqual(0));
    });

    it('will call Chance.js methods if passed their string name', () => {
      const chanceMock = jest.spyOn(Chance.prototype, 'name');
      const arr = generate(['name'], 1, 'chanceSeed');
      expect(arr.length).toBe(1);
      expect(chanceMock).toHaveBeenCalledTimes(1);
      chanceMock.mockRestore();
    });

    it('will return a string if an empty string is input', () => {
      const arr = generate([''], 1, 'stringSeed');
      expect(arr.length).toBe(1);
      arr.forEach((a) => expect(typeof a).toBe('string'));
    });

    it('will return falsy if null is input', () => {
      const arr = generate([null], 1, 'nullSeed');
      expect(arr.length).toBe(1);
      arr.forEach((a) => expect(a).toBeFalsy());
    });

    it('will return a date if a date is input', () => {
      const arr = generate([new Date()], 1, 'dateSeed');
      expect(arr.length).toBe(1);
      arr.forEach((a) => expect(Object.prototype.toString.call(a)).toBe('[object Date]'));
    });

    it('will return an array if an array is input', () => {
      const arr = generate([[1]], 1, 'arrSeed');
      expect(arr.length).toBe(1);
      arr.forEach((a) => {
        assertTruthy(a);
        expect(Object.prototype.toString.call(a)).toBe('[object Array]');
        const aVal = (a as number[])[0];
        expect(aVal).toBeDefined();
        expect(typeof aVal).toBe('number');
        expect(aVal).toBeLessThanOrEqual(MAX);
        expect(aVal).toBeGreaterThanOrEqual(0);
      });
    });

    it('will recreate an object of varying values if one is input', () => {
      const arr = generate(
        [
          {
            str: [''],
            bool: [true],
          },
        ],
        1,
        'objSeed'
      );
      expect(arr.length).toBe(1);
      // TODO: update Generator typings to produce the expected shape data -- e.g. make GenerateValues generic?
      arr.forEach((a: any) => {
        assertTruthy(a);
        expect(a.str).toBeDefined();
        expect(typeof a.str).toBe('string');
        expect(a.bool).toBeDefined();
        expect(typeof a.bool).toBe('boolean');
      });
    });

    it('will allow object values to depend on prior value truthiness', () => {
      const arr = generate(
        [
          {
            str: [''],
            bool: [true],
            maybe: ['', { dependency: 'bool' }],
          },
        ],
        3,
        'depSeed'
      );
      expect(arr.length).toBe(3);
      // TODO: update Generator typings to produce the expected shape data -- e.g. make GenerateValues generic?
      arr.forEach((a: any) => {
        assertTruthy(a);
        expect(a.str).toBeDefined();
        expect(typeof a.str).toBe('string');
        expect(a.bool).toBeDefined();
        expect(typeof a.bool).toBe('boolean');
        if (a.bool) {
          expect(a.maybe).toBeDefined();
          expect(typeof a.maybe).toBe('string');
        } else {
          expect(a.maybe).not.toBeDefined();
        }
      });
    });

    it('will recurse and create an array of root objects up to the specified depth in a nested object', () => {
      const depth = 2;
      const arr = generate(
        [
          {
            str: [''],
            bool: [true],
            children: [[]],
          },
          {
            recurse: 'children',
            depth,
          },
        ],
        1,
        'recursiveSeed'
      );
      expect(arr.length).toBe(1);
      // TODO: update Generator typings to produce the expected shape data -- e.g. make GenerateValues generic?
      arr.forEach((a: any) => {
        assertTruthy(a);
        expect(a.str).toBeDefined();
        expect(typeof a.str).toBe('string');

        expect(a.bool).toBeDefined();
        expect(typeof a.bool).toBe('boolean');

        expect(a.children).toBeDefined();
        expect(Object.prototype.toString.call(a.children)).toBe('[object Array]');

        expect(a.children.length).toBeLessThanOrEqual(depth);

        if (a.children.length > 0) {
          expect(a.children[0].str).toBeDefined();
          expect(a.children[0].bool).toBeDefined();
          expect(a.children[0].children).toBeDefined();
        }
      });
    });

    it('will return falsy in the presence of an undefined or other input', () => {
      const arr = generate([undefined], 1, 'defaultSeed');
      expect(arr.length).toBe(1);
      arr.forEach((a) => expect(a).toBeFalsy());
    });
  });
});
