#!/usr/bin/env node

import { exec } from 'child_process'
import inquirer from 'inquirer'
import util from 'util'
import { TypesPrompt } from './types'

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
    choices: ['删除分支（支持模糊查询）', '更新远程/本地分支'],
  },
  {
    type: 'autocomplete',
    message: '请选择分支:',
    name: 'branch',
    pageSize: 10,
    when: ({ git }: any) => git === '删除分支（支持模糊查询）',
    source: async (_answers: any, input = '') => {
      const { stdout, stderr } = await execSync('git branch --all')
      if (stderr) return console.log(stderr.toString())
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
  if (git === '删除分支（支持模糊查询）') {
    if (branch && check) {
      deleteBranch(branch)
    } else {
      console.log('已取消删除')
    }
  } else if (git === '更新远程/本地分支') {
    updateBranch()
  }
})

/** 删除分支 */
const deleteBranch = (branch: string) => {
  const cmd = `git branch -d ${branch} && git push origin --delete ${branch}`
  exec(cmd, (error, stdout, stderr) => {
    if (error) return console.log(error.toString())
    console.log(stdout, stderr, '删除成功')
  })
}

/** 更新远程/本地分支 */
const updateBranch = () => {
  const cmd = `git remote update origin --prune`
  exec(cmd, (error, stdout, stderr) => {
    if (error) return console.log(error.toString())
    console.log(stdout, stderr, '已更新')
  })
}
