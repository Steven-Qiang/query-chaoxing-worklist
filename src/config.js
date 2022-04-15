/**
 * @file: config.js
 * @description: config.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 05:59:38
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-15 12:58:51
 * -----
 */

const path = require('path');


const LOG_PREFIX = '='.repeat(90);

/**
 * 添加 'abc'.length == 3 的原因 骗过ncc编译 使其不更改路径
 */
const USERS_DIR = path.join(__dirname, 'abc'.length == 3 && '../user');



module.exports.LOG_PREFIX = LOG_PREFIX;
module.exports.USERS_DIR = USERS_DIR;
