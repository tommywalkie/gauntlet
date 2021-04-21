import { expect, it } from '../../imports/expect.ts'
import { task, series, parallel } from './task.ts'

it('should be able to run tasks in sequence', async () => {
    let state = ''
    let itr = 0
    function inc() {
        itr++
        state = state + String(itr)
    }
    await series([
        task(async () => inc()),
        task(async () => inc()),
        task(async () => inc()),
        task(async () => inc()),
        task(async () => inc())
    ])
    expect(state).toBe('12345')
})
it('should be able to run tasks in parallel', async () => {
    let state = ''
    function timeout(ms: number, label: string) {
        return new Promise(resolve => setTimeout(() => {
            state = state + label
            resolve(true)
        }, ms));
    }
    await parallel([
        task(async () => await timeout(40, 'A')),
        task(async () => await timeout(600, 'B')),
        task(async () => await timeout(150, 'C')),
        task(async () => await timeout(250, 'D')),
        task(async () => await timeout(320, 'E'))
    ])
    expect(state).toBe('ACDEB')
})