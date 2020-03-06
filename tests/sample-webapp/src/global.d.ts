declare module NodeJS {
    interface Global {
        testResult: string;
    }
}

declare module 'is-object' {
    export default function isObject(param: any): boolean;
}
