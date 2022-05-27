import dayjs from 'dayjs'
import request from 'request'

export function getGitLib() {
  request(
    'https://gitlab.weike.fm/peng.chen.atom?feed_token=y7HaTBCZzG149tXFR35Y&limit=120&offset=0',
    async function (error, response, body: string) {
      if (error) return console.error('error:', error) // Print the error if one occurred
      const weekFirst = dayjs().startOf('week').add(-2, 'day').format('DD MMM')
      const weekText = body.indexOf(weekFirst)
      const word = body.substring(0, weekText)

      const data: string[] = []
      const regex = /(feat:(.+?)at)|(feat:(.+?)\<\/)/g
      let result
      while ((result = regex.exec(word)) != null) {
        const text = (result[2] || result[4]).replace(/(^\s*)|(\s*$)/g, '')
        !data.includes(text) && data.push(text)
      }
      console.log(`${data.map((e) => e).join('\n')}`)
    }
  )
}
