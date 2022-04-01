/**
 * @file: queue.js
 * @description: queue.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 06:05:17
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-01 08:27:56
 * -----
 */

/**
 * @description 异步任务队列
 */

const Queue = require('p-queue').default;
const queue = new Queue({
  concurrency: 3, // 并发数量
});

module.exports = queue;
