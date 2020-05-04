import * as chalk from "chalk";
import {exec, PromiseResult} from "child-process-promise";
import * as meow from "meow";
import * as prompts from 'prompts';

import {configGet, configSet} from "./aws-cli";
import {ICredentials, IJSONCredentials} from './ICredentials';

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
        profile: {
            type: 'string',
            alias: 'p'
        },
        duration: {
            type: 'number',
            alias: 'd'
        },
        version: {
            alias: 'v'
        }
    }
});

const profileFlagString: string = cli.flags.profile ? `--profile ${cli.flags.profile}` : ""; // Either "--profile {profile}" or ""
const durationFlagString: string = cli.flags.duration ? `--duration-seconds ${cli.flags.duration}` : ""; // Either "--duration-seconds {seconds}" or ""

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

    switch (cli.input[0]) {
        case "set":
            await set();
            break;
        case "restore":
            await restore();
            break;
    }
}

async function set() {
    if (cli.input.length > 2) {
        cli.showHelp(2);
        return;
    }

    // Get MFA Device
    let mfaSerial: string = await configGet("mfa_serial", profileFlagString);
    if (!mfaSerial) {
        mfaSerial = (await prompts({
            type: 'text',
            name: 'mfaSerial',
            message: 'Enter your MFA Device Serial Number (ARN):',
            validate: code => /^(arn:aws:iam::[0-9]{12}:mfa\/|[A-Z0-9]{12}$)/.test(code) ? true : 'Invalid serial number.'
        })).mfaSerial;
        await configSet("mfa_serial", mfaSerial, profileFlagString);
    }

    // Get OTP Code
    let code: string;
    if (cli.input.length == 1) {
        code = (await prompts({
            type: 'text',
            name: 'code',
            message: 'Enter your MFA Code:',
            validate: code => /[0-9]{6}/.test(code) ? true : 'Code must be 6 digits.'
        })).code;
    } else if (cli.input.length == 2) {
        code = cli.input[1];
        if (!/[0-9]{6}/.test(code)) {
            printError("MFA code should be 6 digits.");
            return;
        }
    } else {
        cli.showHelp(2);
        return;
    }

    let credentials: ICredentials;
    try {
        // Restore first, if already MFA authenticated
        const alreadySet: boolean = !!(await configGet("aws_session_token", profileFlagString));
        if (alreadySet) {
            await restore()
        }

        const result: PromiseResult<string> = await exec(`aws sts get-session-token --token-code ${code} --serial-number ${mfaSerial} ${profileFlagString} ${durationFlagString}`);
        credentials = (JSON.parse(result.stdout) as IJSONCredentials).Credentials;
    } catch (e) {
        printAWSError(e.stderr || e);
        return;
    }
    try {

        const [longTermAccessKeyId, longTermSecretAccessKey] = await Promise.all([
            configGet("aws_access_key_id", profileFlagString),
            configGet("aws_secret_access_key", profileFlagString)
        ]);
        await configSet("aws_access_key_id", credentials.AccessKeyId, profileFlagString);
        await configSet("aws_secret_access_key", credentials.SecretAccessKey, profileFlagString);
        await configSet("aws_session_token", credentials.SessionToken, profileFlagString);
        await configSet("expiration", credentials.Expiration, profileFlagString);
        await configSet("long_term_aws_access_key_id", longTermAccessKeyId, profileFlagString);
        await configSet("long_term_aws_secret_access_key", longTermSecretAccessKey, profileFlagString);
        console.log();
        console.log("Expiration: " + new Date(credentials.Expiration).toLocaleString());
        console.log();
    } catch (e) {
        printAWSError(e.stderr || e);
        return;
    }
}

async function restore() {
    try {
        const [longTermAccessKeyId, longTermSecretAccessKey]: string[] = await Promise.all([
            configGet("long_term_aws_access_key_id", profileFlagString),
            configGet("long_term_aws_secret_access_key", profileFlagString)
        ]);
        if (!/^\s*$/.test(longTermAccessKeyId)) {
            await configSet("aws_access_key_id", longTermAccessKeyId, profileFlagString);
            await configSet("aws_secret_access_key", longTermSecretAccessKey, profileFlagString);
            await configSet("aws_session_token", "\" \"", profileFlagString);
            await configSet("expiration", "\" \"", profileFlagString);
            await configSet("long_term_aws_access_key_id", "\" \"", profileFlagString);
            await configSet("long_term_aws_secret_access_key", "\" \"", profileFlagString);
        } else {
            console.log("No long-term credentials found to restore.");
        }
    } catch (e) {
        printAWSError(e.stderr || e);
        return;
    }
}

function printError(message: string) {
    console.log(chalk.red(message));
}

function printAWSError(message: string) {
    console.log(chalk.white("AWS CLI threw error: \n" + chalk.red(message)));
}
