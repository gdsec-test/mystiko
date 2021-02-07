import chalk from 'chalk';

const prefix = 'MYSTIKO:';

export default {
  log: text => {
    console.log(chalk.green(prefix + text));
  },
  warn: text => {
    console.log(chalk.yellow(prefix + text));
  },
  error: text => {
    console.log(chalk.red(prefix + text));
  }
};
