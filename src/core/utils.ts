export function randomId() {
    return Math.random().toString(36).substr(2, 9)
}

/**
 * Creates a sample promise
 */
export function timeout(ms: number) {
    return new Promise(resolve => setTimeout(() => resolve(true), ms));
}

/**
 * Takes an async interator and returns an array
 */
export async function toArray<T = any>(asyncIterator: AsyncIterableIterator<T>): Promise<Array<T>> { 
    const arr = []
    for await(const i of asyncIterator) arr.push(i)
    return arr
}

/**
 * Takes an async interator and returns an array
 */
 export function toArraySync<T = any>(asyncIterator: AsyncIterableIterator<T>): Array<T> { 
    const arr: Array<T> = [];
    (async () => {
        await toArray(asyncIterator)
    })()
    return arr
}

/**
 * Takes a string and returns an `Uint8Array`.
 * Source: https://gist.github.com/NejcZdovc/447d730e0aada3771da7b88804d010f2
 */
export function toTypedArray(s: string): Uint8Array {
    var escstr = encodeURIComponent(s);
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, function(_, p1) {
        return String.fromCharCode('0x' + p1 as any);
    });
    var ua = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, function (ch, i) {
        ua[i] = ch.charCodeAt(0);
    });
    return ua;
}