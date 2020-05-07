import * as prompts from 'prompts';

export async function promptForTokenCode(): Promise<string> {
    return (await prompts({
        message: 'Enter your MFA Code:',
        name: 'tokenCode',
        type: 'text',
        validate: (code) => /[0-9]{6}/.test(code) ? true : 'Code must be 6 digits.',
    })).tokenCode;
}

export async function promptForMFASerial(): Promise<string> {
    return (await prompts({
        message: 'Enter your MFA Device Serial Number (ARN):',
        name: 'mfaSerial',
        type: 'text',
        validate: (serial) => /^(arn:aws:iam::[0-9]{12}:mfa\/|[A-Z0-9]{12}$)/.test(serial) ? true : 'Invalid serial number.',
    })).mfaSerial;
}
