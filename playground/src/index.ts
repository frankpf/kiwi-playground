import express from 'express'
import * as crypto from 'crypto'
import {promises as fs} from 'fs'
import {execSync, exec} from 'child_process'
import {promisify} from 'util'
const execP = promisify(exec)

const app = express()

app.use(express.static('client'))
app.use(express.json())

function asyncWrapper(cb: express.RequestHandler) {
	return (req: express.Request, res: express.Response, next: express.NextFunction) => {
		cb(req, res, next).catch(next)
	}
}

app.post(
	'/run',
	asyncWrapper(async (req, res) => {
		if (typeof req.body.code !== 'string') {
			res.send('Invalid request')
			return
		}
		try {
			const {output: bytecode, status: bytecodeStatus} = await compile(req.body.code, true)
			if (bytecodeStatus === 'error') {
				res.json({ok: true, output: bytecode, bytecode: 'No bytecode.'})
				return
			} else if (bytecodeStatus === 'timeout') {
				res.json({ok: true, output: 'Timeout', bytecode: ''})
				return
			}
			const {status, output} = await compile(req.body.code, false)
			res.json({ok: true, output, status, bytecode})
		} catch (err) {
			console.error(err)
			res.json({ok: false})
		}
	}),
)

async function tmpdir() {
	const name = `/tmp/code-${crypto.randomBytes(16).toString('hex')}`
	await fs.mkdir(name)
	return name
}

async function compile(code: string, bytecode: boolean) {
	const dir = await tmpdir()
	await fs.writeFile(`${dir}/input.kiwi`, code, 'utf8')
	let compileCmd = `bash -c "node /build/kiwi/dist/src/index.js --file /usercode/input.kiwi`
	if (bytecode === false) {
		compileCmd += ` | /build/kiwi/backend/kiwi"`
	} else {
		compileCmd += `"`
	}
	const cmd = `./docker/docker_timeout.sh 5s -i -t --net=none -v ${dir}:/usercode kiwiplay ${compileCmd}`
	const {stdout} = await execP(cmd)
	return parseContainerOutput(stdout)
}

type Status = 'success' | 'error' | 'timeout'
type Output = {status: Status; output: string}
function parseContainerOutput(containerOutput: string): Output {
	const [statusStr, output] = containerOutput.split('output:').map(_ => _.trim())
	const status = statusStr.includes('timeout') ? 'timeout' : statusStr.includes('exited: 1') ? 'error' : 'success'
	return {status, output}
}

const PORT = 3000
app.listen(PORT, () => console.log(`Listening on ${PORT}`))
