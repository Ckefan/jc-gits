#!/usr/bin/env node

import chalk from 'chalk'
import { exec } from 'child_process'
import inquirer from 'inquirer'
import util from 'util'
import { TypesPrompt } from './types'

const log = console.log
const execSync = util.promisify(exec) // 配置异步exec
inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'))

const promptList = [
  {
    type: 'rawlist',
    message: '请选择工具:',
    name: 'tool',
    choices: ['git'],
  },
  {
    type: 'rawlist',
    message: '请选择git操作:',
    name: 'git',
    choices: [
      { value: 1, name: '删除本地/远程分支（支持模糊查询）' },
      { value: 2, name: '删除非当前所有本地分支' },
      { value: 3, name: '更新远程/本地分支' },
    ],
  },
  {
    type: 'autocomplete',
    message: '请选择分支(已过滤stage、uat、master):',
    name: 'branch',
    pageSize: 10,
    when: ({ git }: any) => git === 1,
    source: async (_answers: any, input = '') => {
      console.log(input === '')
      const { stdout, stderr } = await execSync('git branch --all')
      if (stderr) return log(chalk.red(stderr.toString()))
      const list = stdout
        .split('\n')
        .map((e) => e.replace(/(^\s?.*\*\s)|(^\s*)|(\s*$)/g, ''))
        .filter((e) => !['master', 'uat', 'stage'].includes(e))

      return list.filter((e) => e.indexOf(input) > -1)
    },
  },
  {
    type: 'confirm',
    message: ({ branch }: any) => `是否确定删除【${branch}分支】(本地和远程)`,
    name: 'check',
    default: false,
    when: ({ branch }: any) => branch,
  },
]

inquirer.prompt(promptList).then((props: TypesPrompt.promptProps) => {
  const { git, branch, check } = props
  if (git === 1) {
    if (branch && check) {
      deleteBranch(branch)
    } else {
      log(chalk.red('已取消删除'))
    }
  } else if (git === 2) {
    deleteLocalBranch()
  } else if (git === 3) {
    updateBranch()
  }
})

/** 删除本地/远程分支 */
const deleteBranch = (branch: string) => {
  const cmd = `git branch -d ${branch} && git push origin --delete ${branch}`
  exec(cmd, (error, stdout, stderr) => {
    if (error) return log(chalk.red(error.toString()))
    log(stdout, stderr, chalk.green('删除成功'))
  })
}

/* 删除除当前分支之外的所有本地分支 */
const deleteLocalBranch = () => {
  const cmd = `git branch | xargs git branch -d`
  exec(cmd, (error, stdout, stderr) => {
    if (error) return log(chalk.red(error.toString()))
    log(stdout, stderr, chalk.green('删除成功'))
  })
}

/** 更新远程/本地分支 */
const updateBranch = () => {
  const cmd = `git remote update origin --prune`
  exec(cmd, (error, stdout, stderr) => {
    if (error) return log(chalk.red(error.toString()))
    log(stdout, stderr, chalk.green('更新成功'))
  })
}
