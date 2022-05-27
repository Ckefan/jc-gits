#!/usr/bin/env node

import chalk from 'chalk'
import inquirer from 'inquirer'
import InquirerAutocompletePrompt from 'inquirer-autocomplete-prompt'
import { $ } from 'zx'
import { getGitLib } from './gitlab.js'
import { TypesPrompt } from './types'

const log = console.log
inquirer.registerPrompt('autocomplete', InquirerAutocompletePrompt)

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
      { value: 2, name: '删除非当前的所有本地分支' },
      { value: 3, name: '更新远程/本地分支' },
      { value: 4, name: '写周报' },
    ],
  },
  {
    type: 'autocomplete',
    message: '请选择分支(已过滤stage、uat、master):',
    name: 'branch',
    pageSize: 10,
    when: ({ git }: any) => git === 1,
    source: async (_answers: any, input = '') => {
      const { stdout, stderr } = await $`git branch --all`
      if (stderr) {
        log(chalk.red(stderr.toString()))
        return ['']
      }
      const list = stdout
        .split('\n')
        .map((e) => e.replace(/(^\s?.*\*\s)|(^\s*)|(\s*$)/g, ''))
        .filter((e) => !['master', 'uat', 'stage'].includes(e))

      return list.filter((e) => e.indexOf(input) > -1)
    },
  },
  {
    type: 'confirm',
    message: () => `是否确定删除非当前的所有本地分支`,
    name: 'checkDelLocal',
    default: false,
    when: ({ git }: any) => git === 2,
  },
  {
    type: 'confirm',
    message: ({ branch }: any) => `是否确定删除【${branch}分支】(本地和远程)`,
    name: 'checkDelAll',
    default: false,
    when: ({ branch }: any) => branch,
  },
]

inquirer.prompt(promptList).then(async (props: TypesPrompt.promptProps) => {
  const { git, branch, checkDelLocal, checkDelAll } = props
  if (git === 1) {
    if (branch && checkDelAll) {
      deleteBranch(branch)
    } else {
      log(chalk.red('已取消删除'))
    }
  } else if (git === 2) {
    if (checkDelLocal) {
      deleteLocalBranch()
    } else {
      log(chalk.red('已取消删除'))
    }
  } else if (git === 3) {
    updateBranch()
  } else if (git === 4) {
    getGitLib()
  }
})

/** 删除本地/远程分支 */
const deleteBranch = async (branch: string) => {
  const { stderr } =
    await $`git branch -d ${branch} && git push origin --delete ${branch}`
  if (stderr) return log(chalk.red(stderr.toString()))
  log(chalk.green('删除成功'))
}

/* 删除除当前分支之外的所有本地分支 */
const deleteLocalBranch = async () => {
  const { stderr } = await $`git branch | xargs git branch -d`
  if (stderr) return log(chalk.red(stderr.toString()))
  log(chalk.green('删除成功'))
}

/** 更新远程/本地分支 */
const updateBranch = async () => {
  const { stderr } = await $`git remote update origin --prune`
  if (stderr) return log(chalk.red(stderr.toString()))
  log(chalk.green('更新成功'))
}
