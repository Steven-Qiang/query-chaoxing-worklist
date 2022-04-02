/**
 * @file: utils.js
 * @description: utils.js
 * @package: query-chaoxing-worklist
 * @create: 2022-03-30 05:54:08
 * @author: qiangmouren (2962051004@qq.com)
 * -----
 * @last-modified: 2022-04-02 10:37:22
 * -----
 */

const fs = require('fs');
const path = require('path');

const { URL } = require('url');

const qs = require('querystring');
const dayjs = require('dayjs');
const colors = require('colors');
const cheerio = require('cheerio');
const inquirer = require('inquirer');

const { instance, setCookie, getCookie } = require('./request');
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
    method: 'GET',
    url: 'http://mooc2-ans.chaoxing.com/visit/courses/list',
    params: {
      v: Date.now(),
      rss: 1,
      start: 0,
      size: 500,
      catalogId: 0, // cspell-checker:disable-next-line
      searchname: '',
    },
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
        courseId: string;
        clazzid: string;
        cpi: string;
        openc: string;
        enc: string;
    }>} 
*/
async function getWorkParams(courseLink) {
  const stu = await instance.get(courseLink, { maxRedirects: 0 }).then(({ headers }) => instance.get(headers.location));
  const $ = cheerio.load(stu.data);
  const courseid = $('#courseid').val();
  const clazzid = $('#clazzid').val();
  const cpi = $('#cpi').val();
  const enc = $('#oldenc').val();
  const openc = $('#openc').val();

  const homepage = `https://mooc1.chaoxing.com/mycourse/studentcourse?courseId=${courseid}&clazzid=${clazzid}&cpi=${cpi}&openc=${openc}&enc=${enc}`;
  const old = `https://mooc1.chaoxing.com/mycourse/transfer?moocId=${courseid}&ut=s&clazzid=${clazzid}&refer=${encodeURIComponent(homepage)}`;
  const resp = await instance.get(old, { maxRedirects: 0 });

  setCookie(getCookie() + ';' + parseCookies(resp.headers));

  const searchParams = new URL(resp.headers.location).searchParams;
  const entries = searchParams.entries();

  return Object.fromEntries(entries);
}

/**
* @description 获取作业列表
* @param {Awaited<ReturnType<getWorkParams>>} workParams
* @returns {Promise<{
        workURL: string; // 作业地址
        workName: string; // 作业名称
        status: string; // 作业状态
        endTime: string; // 截止时间
        resultNum: string // 成绩
    }[]>}
*/
async function getWorkList(workParams) {
  const resp = await instance.get('https://mooc1.chaoxing.com/work/getAllWork', {
    params: {
      classId: workParams.clazzid,
      courseId: workParams.courseId,
      isdisplaytable: 2,
      mooc: 1,
      ut: 's',
      enc: workParams.enc,
      cpi: workParams.cpi,
      openc: workParams.openc,
    },
  });

  const $ = cheerio.load(resp.data);

  return $('.ulDiv li')
    .toArray()
    .map((x) => $(x))
    .map((x) => {
      const a = x.find('.titTxt a');
      const workURL = a.attr('href');
      const workName = a.attr('title').trim();

      // 作业状态处理
      const _ = getImmediateText(x.find('span.pt5:last strong'));
      const status = colors[_ == '待做' ? 'red' : _ == '已完成' ? 'green' : 'yellow'](_);

      // 结束时间处理
      let endTime = colors.green('无限制');
      let end_time = getImmediateText(x.find('span.pt5:eq(1)'));

      if (end_time) {
        let dayjs_end_time = dayjs(end_time);
        if (dayjs_end_time.isAfter(dayjs())) {
          let diff_hours = Math.abs(dayjs_end_time.diff(dayjs(), 'hours', true)).toFixed(2);
          endTime = colors[diff_hours > 24 ? 'yellow' : 'red'](diff_hours + '小时');
        } else {
          endTime = colors.gray('已结束');
        }
      }

      // 成绩处理
      let resultNum = colors.gray('  暂无成绩');
      // cspell-checker:disable-next-line
      let _resultNum = x.find('.titOper span.fl').text().trim();
      if (_resultNum) {
        let num = Number(_resultNum.replace('分', ''));
        _resultNum = num.toFixed(2);
        if (_resultNum.length < 8) _resultNum = ' '.repeat(7 - _resultNum.length) + _resultNum;
        _resultNum = `${_resultNum} 分`;
        // 及格提示
        resultNum = num > 60 ? colors.green(_resultNum) : colors.red(_resultNum);
      }

      return { workURL, workName, status, endTime, resultNum };
    });
}

/**
 * @description 登录获取cookies
 * @param {{username:string;password:string}} params
 * @return {Promise<string>} cookies
 */
async function login({ username, password }) {
  const resp = await instance.post(
    'https://passport2-api.chaoxing.com/v11/loginregister',
    qs.stringify({
      uname: username,
      code: password,
    })
  );
  if (!resp.data.status) {
    logPaddingPrefix(resp.data.mes, 'red');
    process.exit();
  }

  if (!resp.headers['set-cookie']) {
    logPaddingPrefix('登录失败', 'red');
    process.exit();
  }

  const cookie = parseCookies(resp.headers);

  await fs.promises.writeFile(path.join(USERS_DIR, username), JSON.stringify({ cookie, username, password }));
  logPaddingPrefix('登录成功');
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
 * @returns {string}
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

  if (resp.username == '添加帐号') {
    resp = await inquirer.prompt([
      { type: 'input', message: '请输入用户名:', name: 'username' },
      { type: 'password', message: '请输入密码:', name: 'password' },
    ]);
    return login(resp);
  }

  const user = await fs.promises.readFile(path.join(USERS_DIR, resp.username), 'utf8').then(JSON.parse);
  const isCookieActive = await checkCookies(user.cookie);
  return isCookieActive ? user.cookie : login(user);
}

/**
 * @description 处理set-cookie返回的cookies
 * @param {string} headers
 * @returns
 */
function parseCookies(headers) {
  return headers['set-cookie'].map((x) => x.split(';')[0]).join(';');
}

/**
 * @description 获取类似 <span><span>abc</span>def</span> 中的 def
 * @param {Cheerio<Element>} element
 * @returns {string}
 */
function getImmediateText(element) {
  return element.clone().children().remove().end().text().trim();
}

/**
 * @description 打印日志并带上颜色
 * @param {any} obj
 * @param {keyof import('colors').Color} color
 */
function logWithColors(obj, color = 'green') {
  console.log(colors[color](obj));
}

/**
 * @description 打印日志并带上prefix
 * @param {string} text
 * @param {keyof import('colors').Color} color
 */
function logPaddingPrefix(text, color = 'green') {
  const pad = 12;
  if (text.length < pad) {
    const padLength = pad - text.length - 1;
    const padText = ' '.repeat(padLength / 2);
    text = padText + text + padText;
  }
  logWithColors(`\n${LOG_PREFIX}${text}${LOG_PREFIX}`, color);
}

module.exports = {
  login,
  loadCookies,
  getCourseListData,
  getWorkList,
  getWorkParams,
  logWithColors,
  logPaddingPrefix,
};
