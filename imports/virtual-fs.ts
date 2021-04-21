/**
 * Virtual filesystem implementation inspired from
 * [@deebloo](https://github.com/deebloo)'s [`virtual-fs`](https://github.com/deebloo/virtual-fs)
 * @license
 * MIT License
 * 
 * Copyright (c) 2019 Danny Blue
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
export class VirtualFs<T = any> {
    private contents = new Map<string, T>();

    get size() {
        return this.contents.size;
    }

    add(path: string, value?: T): VirtualFs<T> {
        this.contents.set(path, value as T);
        return this;
    }

    remove(path: string): VirtualFs<T> {
        this.getPaths().forEach(p => {
            if (p.startsWith(path)) {
                this.contents.delete(p);
            }
        });
        return this;
    }

    move(path: string, moveTo: string): VirtualFs<T> {
        const children = this.getChildPaths(path);

        if (this.contents.has(path)) {
            this.contents.set(moveTo, this.read(path));
            this.contents.delete(path);
        }

        children.forEach(p => {
            const parsed = p.split(path);
            const newPath = moveTo + parsed[parsed.length - 1];
            this.contents.set(newPath, this.read(p));
            this.contents.delete(p);
        });

        return this;
    }

    clear(): VirtualFs<T> {
        this.contents.clear();
        return this;
    }

    read(path: string): T {
        return this.contents.get(path) as T;
    }

    getPaths(): string[] {
        return Array.from(this.contents.keys());
    }

    getContents(): T[] {
        return Array.from(this.contents.values());
    }

    getRoot(): string[] {
        return this.getChildPaths('');
    }

    getChildPaths(path: string): string[] {
        return this.getPaths().filter(p => p.startsWith(path) && p !== path);
    }

    getChildNames(path: string): string[] {
        return this.getChildPaths(path)
            .map(fullPath => fullPath.split(path)[1].split('/')[1]) // Find the first child
            .reduce((final: string[], pathRef) => {
                // Dedupe the list
                if (final.indexOf(pathRef) <= -1) {
                    final.push(pathRef);
                }
                return final;
            }, []);
    }

    map<R>(fn: (res: T, path: string) => R): VirtualFs<R> {
        const res = new VirtualFs<R>();
        this.contents.forEach((item, key) => {
            res.add(key, fn(item, key) as R);
        });
        return res;
    }

    filter(fn: (res: T, path: string) => boolean): VirtualFs<T> {
        const res = new VirtualFs<T>();
        this.contents.forEach((item, key) => {
            if (fn(item, key)) {
                res.add(key, item);
            }
        });
        return res;
    }
}