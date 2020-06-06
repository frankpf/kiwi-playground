const {execSync} = require('child_process')

const HOST = 'root@kiwi.frankpf.com'
function run(cmd: string) {
	console.log(`+ ${cmd}`)
	console.log(execSync(cmd).toString('utf8'))
}

const sshCommands = [
	'rm -rf playground',
	'unzip playground.zip',
	'rm playground.zip',
	'cd playground',
	'npm i',
	'cd docker',
	'docker build -t kiwiplay .',
	'pm2 reload index',
].join(' && ')

try {
	run('cd playground && yarn run tsc && rm -rf node_modules')
	run('zip -r playground.zip playground')
	run(`scp playground.zip ${HOST}:~/playground.zip`)
	run(`ssh ${HOST} '${sshCommands}'`)
} finally {
	run('rm playground.zip')
	run('cd playground && yarn')
}
