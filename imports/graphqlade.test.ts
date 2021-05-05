import { expect, it } from './expect.ts'
import { AsyncPushIterator } from './graphqlade.ts'

it('should be able to iterate over asynchronously pushed data', async () => {
    let cleared = false;

    const iterator = new AsyncPushIterator<number>((it) => {
        let i = 0;
        const intervalId = setInterval(() => it.push(++i), 100);
        const timeoutId = setTimeout(() => it.return(), 550);

        return () => {
            cleared = true;
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    });

    const results: number[] = [];

    expect(cleared).toBeFalsy()
    for await (const i of iterator) {
        expect(cleared).toBeFalsy()
        results.push(i);
    }
    expect(results[0]).toBe(1)
    expect(results[1]).toBe(2)
    expect(cleared).toBeTruthy()
})