import {exec, PromiseResult} from 'child-process-promise';
import {IJSONCredentials} from './IJSONCredentials';
import {ISessionCredentials} from './ISessionCredentials';

export async function configureSet(varname: string, value: string, profileFlagString: string): Promise<void> {
    await exec(`aws configure set ${varname} ${value} ${profileFlagString}`);
}

export async function getSessionToken(tokenCode: string, mfaSerial: string, profileString: string, durationString: string): Promise<ISessionCredentials> {
    const result: PromiseResult<string> = await exec(`aws sts get-session-token --token-code ${tokenCode} --serial-number ${mfaSerial} ${profileString} ${durationString}`);
    return (JSON.parse(result.stdout) as IJSONCredentials).Credentials;
}
