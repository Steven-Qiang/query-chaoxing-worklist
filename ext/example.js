/**
 * @file: example.js
 * @description: example.js
 * @package: query-chaoxing-worklist
 * @create: 2022-04-01 08:41:24
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-01 08:46:57
 * -----
 */

const workList = [
  [
    '面向对象程序设计(Java)',
    '练习5-20220329',
    '\u001b[33m待批阅\u001b[39m',
    '\u001b[90m  暂无成绩\u001b[39m',
    '\u001b[31m2.87小时\u001b[39m',
  ],
  [
    'Node.js',
    '练习3-20220226',
    '\u001b[32m已完成\u001b[39m',
    '\u001b[32m 100.00 分\u001b[39m',
    '\u001b[33m116.72小时\u001b[39m',
  ],
  [
    '新技能英语高级课程（2）',
    '作业20220320164121',
    '\u001b[32m已完成\u001b[39m',
    '\u001b[31m   0.00 分\u001b[39m',
    '\u001b[32m无限制\u001b[39m',
  ],
  [
    'Android应用软件开发',
    '练习3-20220317',
    '\u001b[33m待批阅\u001b[39m',
    '\u001b[90m  暂无成绩\u001b[39m',
    '\u001b[33m332.72小时\u001b[39m',
  ],
  [
    'Java程序设计',
    '练习1-20220308',
    '\u001b[31m未交\u001b[39m',
    '\u001b[90m  暂无成绩\u001b[39m',
    '\u001b[33m584.87小时\u001b[39m',
  ],
  [
    'Java程序设计',
    '作业1：定义Person类',
    '\u001b[32m已完成\u001b[39m',
    '\u001b[32m 100.00 分\u001b[39m',
    '\u001b[33m587.70小时\u001b[39m',
  ],
  [
    '大学生心理健康教育',
    '第一单元小组实训作业',
    '\u001b[32m已完成\u001b[39m',
    '\u001b[32m  88.00 分\u001b[39m',
    '\u001b[90m已结束\u001b[39m',
  ],
];

const table = require('table');
const stream = table.createStream({
  columns: [{}, { width: 80 }, { width: 10, alignment: 'center' }, { width: 10 }],
  columnCount: 5,
  columnDefault: { width: 50 },
});

for (const work of workList) {
  stream.write(work);
}
