import { expect, it } from '../../imports/expect.ts'
import { task, series, parallel, priorityQueue } from './task.ts'

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
it('should be able to prioritize tasks', async () => {
    let state = ''
    function timeout(ms: number, label: string) {
        return new Promise(resolve => setTimeout(() => {
            state = state + label
            resolve(true)
        }, ms));
    }
    const { run, pushTask } = priorityQueue([
        task(async () => await timeout(20, 'A'), { priority: 0 }),
        task(async () => await timeout(100, 'B'), { priority: 2 }),
        task(async () => await timeout(10, 'C'), { priority: 5 }),
        task(async () => await timeout(20, 'D'), { priority: 1 }),
        task(async () => await timeout(100, 'E'), { priority: 4 })
    ])
    run()
    setTimeout(() => pushTask(
        async () => await timeout(20, 'F'),
        { priority: 6 }
    ), 40)
    await timeout(700, '').then(_ => expect(state).toBe('CFEBDA'))
})