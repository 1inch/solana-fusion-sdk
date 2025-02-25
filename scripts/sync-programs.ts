import {execSync} from 'child_process'
import path from 'node:path'

function main(): void {
    const root = path.join(__dirname, '..')
    const contractDir = path.join(__dirname, '../contracts/fusion-contract')

    execSync('yarn cache clean && yarn && yarn build', {
        cwd: contractDir,
        stdio: 'inherit'
    })

    execSync(
        `cp ./contracts/fusion-contract/target/deploy/*.so ./tests/fixtures`,
        {
            cwd: root,
            stdio: 'inherit'
        }
    )
}

main()
