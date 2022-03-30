/**
 * @file: utils.js
 * @description: utils.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 05:54:08
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-03-30 06:05:03
 * -----
 */

const fs = require('fs');
const path = require('path');

const qs = require('querystring');
const colors = require('colors');
const cheerio = require('cheerio');
const inquirer = require('inquirer');

const { instance } = require('./request');
const { Cookie } = require('tough-cookie');
const { LOG_PREFIX, USERS_DIR } = require('./config');

/**
 * @description 获取课程列表
 * @return {Promise<{
      courseName:string, // 课程名
      courseLink:string // 课程链接
    }[]>}
 */
async function getCourseListData() {
  const resp = await instance.request({
    method: 'POST',
    url: 'https://mooc1-1.chaoxing.com/visit/courselistdata',
    data: qs.stringify({
      courseType: 1,
      courseFolderId: 0,
      courseFolderSize: 0,
    }),
  });

  const $ = cheerio.load(resp.data);

  const course = $('li.course').not(
    (_i, el) => $(el).has('a.not-open-tip').length // 过滤已结束课程
  );
  return course
    .toArray()
    .map((x) => $(x))
    .map((x) => ({
      courseName: x.find('.course-name').text().trim(),
      courseLink: x.find('a').attr('href').trim(),
    }));
}

/**
* @description 获取页面参数
* @param {string} courseLink 课程页面链接
* @return {Promise<{
    cpi:string,
    enc:string,
    courseId:string,
    classId:string
    }>} 
*/
async function getWorkParams(courseLink) {
  const stu = await instance.get(courseLink, { maxRedirects: 0 }).then(({ headers }) => instance.get(headers.location));
  const $ = cheerio.load(stu.data);
  const cpi = $('#cpi').val(); // cspell-checker:disable-next-line
  const courseId = $('#courseid').val();
  const enc = $('#workEnc').val(); // cspell-checker:disable-next-line
  const classId = $('#clazzid').val();
  return {
    cpi,
    enc,
    courseId,
    classId,
  };
}
/**
* @description 获取作业列表
* @param {Awaited<ReturnType<getWorkParams>>} workParams
* @returns {Promise<{
        workName: string; // 作业名称
        status: string; // 作业状态
        time: string; // 截止时间
    }[]>}
*/
async function getWorkList(workParams) {
  const resp = await instance.get('https://mooc1.chaoxing.com/mooc2/work/list', {
    params: { ...workParams, ut: 's' },
  });

  const $ = cheerio.load(resp.data);

  return $('.bottomList li')
    .toArray()
    .map((x) => $(x))
    .map((x) => {
      const workName = x.find('p.overHidden2').text().trim();
      const _ = x.find('p.status').text().trim();

      const status = ((_) => {
        switch (_) {
          case '未交':
            return colors.red(_);
          case '已完成':
            return colors.green(_);
          default:
            return colors.yellow(_);
        }
      })(_);

      const time = x.find('.time.notOver').text().trim() || colors.gray('已结束');
      return { workName, status, time };
    });
}

/**
 * @description 登录获取cookies
 * @param {string} username
 * @param {string} password
 * @return {Promise<string>} cookies
 */
async function getCookies(username, password) {
  const resp = await instance.post(
    'https://passport2-api.chaoxing.com/v11/loginregister',
    qs.stringify({
      uname: username,
      code: password,
    })
  );
  if (!resp.data.status) {
    console.log(colors.red(resp.data.mes));
    process.exit();
  }

  if (!resp.headers['set-cookie']) {
    console.log(colors.red(LOG_PREFIX + '登录失败' + LOG_PREFIX));
    process.exit();
  }

  const cookie = resp.headers['set-cookie']
    .map(Cookie.parse)
    .map(({ key, value }) => `${key}=${value}`)
    .join(';');

  await fs.promises.writeFile(path.join(USERS_DIR, username), JSON.stringify({ cookie, username, password }));
  console.log(colors.green(LOG_PREFIX + '登录成功' + LOG_PREFIX));
  return cookie;
}
/**
 * @description 检测cookie是否有效
 * @param {string} cookie
 * @return {Promise<boolean>}
 */
async function checkCookies(cookie) {
  const resp = await instance.get('http://mooc1-api.chaoxing.com/mycourse/backclazzdata?view=json&rss=1', {
    headers: { cookie },
  });
  return resp.data.result === 1;
}
/**
 * @description 加载cookies
 */
async function loadCookies() {
  const users = await fs.promises.readdir(USERS_DIR);
  let resp = await inquirer.prompt([
    {
      type: 'list',
      name: 'username',
      message: '请选择操作的帐号',
      choices: [...users, new inquirer.Separator(), '添加帐号'],
    },
  ]);
  let cookie;
  if (resp.username == '添加帐号') {
    resp = await inquirer.prompt([
      { type: 'input', message: '请输入用户名:', name: 'username' },
      { type: 'password', message: '请输入密码:', name: 'password' },
    ]);
    cookie = await getCookies(resp.username, resp.password);
  } else {
    const user = await fs.promises.readFile(path.join(USERS_DIR, resp.username), 'utf8').then(JSON.parse);
    cookie = (await checkCookies(user.cookie)) ? user.cookie : await getCookies(user.username, user.password);
  }
  return cookie;
}

module.exports = {
  loadCookies,
  getCookies,
  getCourseListData,
  getWorkList,
  getWorkParams,
};
