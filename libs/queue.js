/**
 * @file: queue.js
 * @description: queue.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 06:05:17
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-03-30 06:05:31
 * -----
 */

const Queue = require('p-queue').default;
const queue = new Queue({ concurrency: 3 });

module.exports = queue;
