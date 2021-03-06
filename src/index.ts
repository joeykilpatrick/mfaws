import * as chalk from 'chalk';
import * as meow from 'meow';
import * as os from 'os';

import {Profile} from './profile';
import {promptForTokenCode} from './prompts';

const cli = meow(`
    Usage
      $ mfaws set <mfa code>
      $ mfaws restore

    Options
      --profile, -p
      --duration, -d  In seconds

    Examples
      $ mfaws set 123456
      $ mfaws set 123456 --profile other-user
      $ mfaws restore
      $ mfaws restore --profile other-user
`, {
    flags: {
        duration: {
            alias: 'd',
            type: 'number',
        },
        profile: {
            alias: 'p',
            type: 'string',
        },
        version: {
            alias: 'v',
        },
    },
});

export = async () => {
    // If version flag present, print version number
    if (cli.flags.version) {
        cli.showVersion();
        return;
    }

    // If no inputs, show help.
    if (cli.input.length < 1) {
        cli.showHelp(2);
        return;
    }

    const credentialsFilePath: string = `${os.homedir()}/.aws/credentials`; // TODO Check if env var overwrites this
    const configFilePath: string = `${os.homedir()}/.aws/config`; // TODO Check if env var overwrites this

    const profileName = cli.flags.profile || 'default';

    const profile: Profile = new Profile(profileName, credentialsFilePath, configFilePath);

    if (!profile.accessKeyId || !profile.secretAccessKey) {
        printError(`Did not find an access key id and secret access key for profile "${profile.profileName}"`);
        return;
    }

    const command = cli.input[0];
    switch (command) {
        case 'set':
            await set(profile);
            break;
        case 'restore':
            await profile.restoreLongTermCredentials();
            break;
        default:
            console.log(`Unknown command: ${command}`);
            cli.showHelp(2);
    }
}

async function set(profile: Profile) {
    if (cli.input.length > 2) {
        cli.showHelp(2);
        return;
    }

    // Get OTP Code
    let tokenCode: string;
    if (cli.input.length === 1) {
        tokenCode = await promptForTokenCode();
    } else if (cli.input.length === 2) {
        tokenCode = cli.input[1];
        if (!/[0-9]{6}/.test(tokenCode)) {
            printError('MFA code should be 6 digits.');
            return;
        }
    } else {
        cli.showHelp(2);
        return;
    }

    await profile.setNewShortTermCredentials(tokenCode, cli.flags.duration);
}

function printError(message: string) {
    console.log(chalk.red(message));
}
