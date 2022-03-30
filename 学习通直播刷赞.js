/**
 * @file: 学习通直播刷赞.js
 * @description: 学习通直播刷赞.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 02:41:31
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-03-30 06:08:30
 * -----
 */

const axios = require('axios').default;
const delay = require('delay');

const Queue = require('p-queue').default;
const queue = new Queue({ concurrency: 15 }); // 并发

(async () => {
  while (1) {
    queue.add(async () => {
      try {
        const resp = await axios.get(
          'https://zhibo.chaoxing.com/apis/live/setLivePariseCount?streamName=&vdoid=', // 自行抓包填写
          {
            headers: {
              cookie: '', // 自行抓包填写
            },
          }
        );
        return console.log(new Date().toLocaleString(), '给老师点赞成功', resp.data.data.count);
      } catch (e) {
        1;
      }
    });

    await delay(50);
  }
})();
