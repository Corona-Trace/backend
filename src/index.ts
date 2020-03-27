import express from 'express'
import bunyan from 'bunyan';

const log = bunyan.createLogger({ name: 'api' })

async function main (): Promise<void> {

  const app = express();

  app.get('/hello', (req, res) => {
    log.info('hello world!')
    res.status(200).send('hello world!')
  })

  const port = Number(process.env.PORT) || 8080

  await new Promise((resolve, reject) => app.listen(port, '0.0.0.0', err => err ? reject(err) : resolve()))

  log.info(`server online at 0.0.0.0:${port}!`)
}

main()
  .catch(err => {
    log.error(err.message || 'an unknown error occured while starting up');
    process.exit(1)
  })
