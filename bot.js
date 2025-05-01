const fs = require('fs');
const axios = require('axios');
const path = require('path');
const schedule = require('node-schedule');
const chalk = require('chalk');
const figlet = require('figlet');

const API_URL = 'https://api.padolabs.org/achievement/complete';
const TOKEN_FILE = path.join(__dirname, 'token.txt');
const TASK_IDENTIFIER = 'DAILY_CHECK_IN';
const SCHEDULE_TIME = '0 0 9 * * *'; // Setiap hari pukul 09:00

function readToken() {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch (error) {
    console.error(chalk.red('Error reading token file:'), error.message);
    process.exit(1);
  }
}

async function performDailyCheckIn() {
  const token = readToken();

  try {
    console.log(chalk.blueBright('\n[INFO] Performing daily check-in...'));

    const response = await axios.post(API_URL,
      {
        taskIdentifier: TASK_IDENTIFIER,
        ext: {}
      },
      {
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'authorization': `Bearer ${token}`,
          'client-type': 'WEB',
          'client-version': '0.3.24',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
        }
      }
    );

    const result = response.data;

    if (result.rc === 0 && result.mc === 'SUCCESS') {
      console.log(chalk.green(`✅ Check-in successful! Earned ${result.result.points} points.`));
      console.log(chalk.gray(`🕒 Time: ${new Date().toLocaleString()}\n`));
      return true;
    } else {
      console.error(chalk.red('❌ Check-in failed:'), result.msg || 'Unknown error');
      return false;
    }

  } catch (error) {
    console.error(chalk.red('❌ Error performing check-in:'), error.response?.data || error.message);
    return false;
  }
}

function setupScheduler() {
  const dailyJob = schedule.scheduleJob(SCHEDULE_TIME, async function () {
    console.log(chalk.yellow(`\n[⏰ Scheduled] Running check-in at ${new Date().toLocaleString()}`));
    await performDailyCheckIn();
  });

  console.log(chalk.cyan('Scheduler started!'));
  console.log(chalk.cyan('Next check-in scheduled for:'), chalk.white(dailyJob.nextInvocation().toLocaleString()));

  return dailyJob;
}

async function runImmediately() {
  console.log(chalk.magenta('\n[Manual] Running immediate check-in...'));
  return await performDailyCheckIn();
}

async function main() {
  console.clear();

  const pastel = chalk.hex('#FFAACC'); // pastel pink
  const ownerTag = chalk.hex('#A0C4FF'); // pastel blue

  console.log(pastel(figlet.textSync('Primus', { horizontalLayout: 'full' })));
  console.log(ownerTag('Owner: t.me/didinska\n'));

  console.log(chalk.gray('🔄 Starting daily check-in bot...\n'));

  const args = process.argv.slice(2);
  const runNow = args.includes('--now') || args.includes('-n');
  const scheduleOnly = args.includes('--schedule-only') || args.includes('-s');

  try {
    if (runNow) {
      await runImmediately();
    }

    if (!args.includes('--now-only')) {
      setupScheduler();
    } else {
      console.log(chalk.gray('\n[Mode] Immediate-only. Scheduler not set up.\n'));
    }
  } catch (error) {
    console.error(chalk.red('Unexpected error:'), error);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  performDailyCheckIn,
  setupScheduler,
  runImmediately
};
