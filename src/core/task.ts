import { EventEmitter } from '../../imports/deno_events.ts'
import { randomId } from './utils.ts'

interface TaskPayload<T = any> {
    previousReport?: T
    props?: Record<string, any>
}

type TaskJob<T = any, K = any> = (payload: TaskPayload<K>) => Promise<T>

interface TaskEvents {
    job_start(): void;
    job_end(report: any): void;
    job_fail(reason: any): void;
}

interface Task<T = any> {
    __id: string,
    priority: number,
    run: (props?: any) => Promise<T>
}

interface TaskOptions {
    eventSource?: EventEmitter<TaskEvents>,
    priority?: number,
    label?: string
}

export function task<T>(cb: TaskJob<T>, options?: TaskOptions): Task {
    const settings = options ?? {}
    const __id = randomId()
    let eventSource = settings.eventSource ?? new EventEmitter<TaskEvents>()
    let priority = settings.priority ?? 0
    return {
        __id,
        priority,
        run: async function(props?: any) {
            eventSource.emit('job_start')
            return await cb({ props }).then((result: any) => {
                const report = { result }
                eventSource.emit('job_end', { report })
                return report
            }).catch((reason: Error) => {
                eventSource.emit('job_fail', reason)
                throw new Error(`Error encountered : ${reason}`)
            })
        }
    }
}

export async function parallel(tasks: Task[], props?: any): Promise<any[]> {
    return Promise.all(tasks.map(async (task: Task) => task.run(props)))
}

export async function series(tasks: Task[], props?: any): Promise<any[]> {
    const reports: any[] = []
    for (let i = 0; i < tasks.length; ++i) {
        await tasks[i].run(props).then((report: any) => reports.push(report))
    }
    return reports
}

/**
 * Non-blocking priority queue for `Task` objects.
 * 
 * This allows to run tasks sequentially in the background by priority
 * without blocking the main thread, hence a proper understanding of JavaScript
 * asynchronous mechanisms is recommended before using this method which heavily
 * relies on `setTimeout`.
 * 
 * **NOTE**: Deno tests have short lifetime, make sure the said test case
 * surrounding the use of `priorityQueue` doesn't end before all queued tasks are done.
 * 
 * The method returns two functions:
 * - `run()` which allows to start the queue with an initial array of tasks
 * - `pushTask(fn, options)` which allows to add new task to the queue (but doesn't restart
 * an ended queue)
 * 
 * ```js
 * function wait(ms) {
 *   return new Promise(resolve => setTimeout(() => resolve(true), ms))
 * }
 * 
 * const { run, pushTask } = priorityQueue([
 *    task(async () => await wait(20), { priority: 2 }), // Task #1
 *    task(async () => await wait(20), { priority: 4 }), // Task #2
 *    task(async () => await wait(20), { priority: 5 }), // Task #3
 * ])
 * 
 * // Start the queue
 * run()
 * 
 * // Wait 45ms and push new task which will run after task #2
 * setTimeout(
 *   () => pushTask(async () => await wait(20), { priority: 3 }
 * ), 45)
 * ```
 */
export function priorityQueue<T>(tasks: Task<T>[], props?: any) {
    let pendingTasks = [...tasks]
    function runRemainingTasks() {
        setTimeout(async () => {
            const topPriorityTask = pendingTasks.sort((a, b) => b.priority - a.priority)[0]
            await topPriorityTask.run(props).catch(_ => {})
            pendingTasks = pendingTasks.filter(el => el.__id !== topPriorityTask.__id)
            if (pendingTasks.length > 0) runRemainingTasks()
        })
    }
    return {
        run: function() {
            setTimeout(() => runRemainingTasks())
        },
        pushTask: function(fn: TaskJob, options: TaskOptions) {
            pendingTasks.push(task(fn, options))
        }
    }
}