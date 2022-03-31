/**
 * @file: postbuild.js
 * @description: postbuild.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-31 01:04:36
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-03-31 01:47:01
 * -----
 */

const fs = require('fs');

fs.promises.copyFile('./dist/index.js', './index.js')

console.log('postbuild');