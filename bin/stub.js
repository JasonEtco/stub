#!/usr/bin/env node

'use strict'

const path = require('path')
const inquirer = require('inquirer')
const program = require('commander')
const {scaffold} = require('egad')
const kebabCase = require('lodash.kebabcase')
const camelCase = require('lodash.camelcase')
const chalk = require('chalk')
const spawn = require('cross-spawn')
const DEFAULT_TEMPLATE = 'https://github.com/JasonEtco/stub-template'

program
  .usage('[options] [destination]')
  .option('-t, --title <title>', 'Title')
  .option('-d, --desc "<description>"', 'Description (contain in quotes)').parse(process.argv)
  .option('-b, --branch <branch-name>', 'Specify a branch', 'master')
  .option('--template <template-url>', 'URL or name of custom template', DEFAULT_TEMPLATE)

if (!program.args.length) throw new Error('You must include a destination.')
const project = program.args[program.args.length - 1]
const destination = program.args.length
  ? path.resolve(process.cwd(), program.args.shift())
  : process.cwd()

async function go (prompts) {
  const answers = await inquirer.prompt(prompts)

  answers.project = kebabCase(project)
  answers.projectSlug = camelCase(project)

  const results = await scaffold(program.template, destination, answers, {
    overwrite: Boolean(program.overwrite),
    branch: program.branch
  })

  results.forEach(fileinfo => {
    console.log(`${fileinfo.skipped ? chalk.yellow('skipped existing file')
      : chalk.green('created file')}: ${fileinfo.path}`)
  })

  console.log(chalk.blue('Finished scaffolding files!'))

  console.log(chalk.blue('\nInstalling Node dependencies!'))
  const child = spawn('npm', ['install', '--prefix', destination], {stdio: 'inherit'})
  child.on('close', code => {
    if (code !== 0) {
      console.log(chalk.red(`Could not install npm dependencies. Try running ${chalk.bold('npm install')} yourself.`))
      return
    }
    console.log(chalk.blue('\nDone!'))
  })
}

go([
  {
    type: 'input',
    name: 'title',
    default: () => kebabCase(project),
    message: 'Title:',
    when: !program.title
  }, {
    type: 'input',
    name: 'description',
    default: () => 'My incredible project',
    message: 'Description:',
    when: !program.desc
  }
])
