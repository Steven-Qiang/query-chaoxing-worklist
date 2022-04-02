/**
 * @file: config.js
 * @description: config.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 05:59:38
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-02 10:33:20
 * -----
 */
const path = require('path');

const LOG_PREFIX = '='.repeat(100);
const USERS_DIR = path.join(__dirname, '../user');

module.exports.LOG_PREFIX = LOG_PREFIX;
module.exports.USERS_DIR = USERS_DIR;
