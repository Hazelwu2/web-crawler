const request = require('request');
const cheerio = require('cheerio');
const schedule = require('node-schedule');
const nodemailer = require('nodemailer');

// 台灣銀行匯率
const url = 'https://rate.bot.com.tw/xrt?Lang=zh-TW';

/*
    取得內容，解析url並貼上
*/
function getCurrency() {
  request(url, (err, res, body) => {
    // 將內容字串轉換為 DOM
    let $ = cheerio.load(body);

    // 取得匯率 element
    $('td.rate-content-cash').each((idx, element) => {
      let $element = $(element);


      if ($element.data('table') === '本行現金賣出' && !!+$element.text()) {
        var currency = $($element.siblings()[0])
          .text()
          .trim();

        var currency = currency.split(' ')[0];
        switch (currency) {
          case '日圓':
            console.log(currency + '\t:' + $element.text());
            // 如果匯率小於設定值，就寄信吧

            if (currency) {
              // 初始化寄信
              var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                  user: 'user@gmail.com',
                  pass: 'password'
                }
              });
              
              const date = new Date();
              var h = date.getHours();
              var m = date.getMinutes();
              var s = date.getSeconds();
        
              if (h < 10) {
                h = '0' + h;
              }
              if (m < 10) {
                m = '0' + m;
              }
              if (s < 10) {
                s = '0' + s;
              }
              var time = `${h}:${m}:${s}`;

              var mailOptions = {
                from: '"匯率爬蟲機器人" <tinazx056@gmail.com>', //寄件者
                to: 'tinazx056@gmail.com', //收件者
                subject: '該買日幣啦', //標題
                text: '現在時間：' + time + '，日幣匯率為' + $element.text(), //純文字內容
                html:
                  '現在時間：' + time + '，日幣匯率為 <b>' + $element.text() + '</b>' //帶有 HTML 格式的內容
              };
              transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log('Email sent: ' + info.response);
                }
              });
            }
            break;
          default:
            break;
        }
      }
    });
    process.stdout.write('\x07');
    console.log('===================================================');
  });
}
function scheduleCronstyle() {
  // parse every 5 seconds
  schedule.scheduleJob('*/5 * * * * *', function() {
    getCurrency();
  });
}
scheduleCronstyle();
