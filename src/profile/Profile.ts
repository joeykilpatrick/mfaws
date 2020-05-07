import * as chalk from 'chalk';
import {configureSet, getSessionToken} from '../aws-cli';
import {ISessionCredentials} from '../ISessionCredentials';
import {IProfileVariables} from './IProfileVariables';
import {VariableName} from './VariableName';

export class Profile {
    private readonly profileName: string;
    private accessKeyId: string = ' ';
    private secretAccessKey: string = ' ';
    private sessionToken: string = ' ';
    private expiration: string = ' ';
    private longTermAccessKeyId: string = ' ';
    private longTermSecretAccessKey: string = ' ';
    public mfaSerial: string = ' ';

    constructor(profileName: string, profileVariables: IProfileVariables) {
        this.profileName = profileName;
        Object.entries(profileVariables[profileName]).forEach(([key, value]: [string, string]) => {
            switch (key) {
                case VariableName.ACCESS_KEY_ID:
                    this.accessKeyId = value;
                    break;
                case VariableName.SECRET_ACCESS_KEY:
                    this.secretAccessKey = value;
                    break;
                case VariableName.SESSION_TOKEN:
                    this.sessionToken = value;
                    break;
                case VariableName.EXPIRATION:
                    this.expiration = value;
                    break;
                case VariableName.LONG_TERM_ACCESS_KEY_ID:
                    this.longTermAccessKeyId = value;
                    break;
                case VariableName.LONG_TERM_SECRET_ACCESS_KEY:
                    this.longTermSecretAccessKey = value;
                    break;
                case VariableName.MFA_SERIAL:
                    this.mfaSerial = value;
                    break;
            }
        });
    }

    public longTermCredentialsSet(): boolean {
        return !/^\s*$/.test(this.longTermAccessKeyId);
    }

    public async restoreLongTermCredentials(): Promise<void> {
        try {
            if (this.longTermCredentialsSet()) {
                await configureSet(VariableName.ACCESS_KEY_ID, this.longTermAccessKeyId, this.getProfileFlag());
                await configureSet(VariableName.SECRET_ACCESS_KEY, this.longTermSecretAccessKey, this.getProfileFlag());
                await configureSet(VariableName.SESSION_TOKEN, '" "', this.getProfileFlag());
                await configureSet(VariableName.EXPIRATION, '" "', this.getProfileFlag());
                await configureSet(VariableName.LONG_TERM_ACCESS_KEY_ID, '" "', this.getProfileFlag());
                await configureSet(VariableName.LONG_TERM_SECRET_ACCESS_KEY, '" "', this.getProfileFlag());
                this.accessKeyId = this.longTermAccessKeyId;
                this.secretAccessKey = this.longTermSecretAccessKey;
                this.sessionToken = '" "';
                this.expiration = '" "';
                this.longTermAccessKeyId = '" "';
                this.longTermSecretAccessKey = '" "';
            } else {
                console.log('No long-term credentials found to restore.');
            }
        } catch (e) {
            printAWSError(e.stderr || e);
            return;
        }
    }

    async setNewShortTermCredentials(tokenCode: string, duration: number): Promise<void> {
        try {
            // Restore first, if already MFA authenticated
            const alreadySet: boolean = !/^\s*$/.test(this.sessionToken);
            if (alreadySet) {
                await this.restoreLongTermCredentials();
            }

            const durationFlagString: string = duration ? `--duration-seconds ${duration}` : ''; // Either "--duration-seconds {seconds}" or ""

            const credentials: ISessionCredentials = await getSessionToken(tokenCode, this.mfaSerial, this.getProfileFlag(), durationFlagString);

            await configureSet(VariableName.LONG_TERM_ACCESS_KEY_ID, this.accessKeyId, this.getProfileFlag());
            await configureSet(VariableName.LONG_TERM_SECRET_ACCESS_KEY, this.secretAccessKey, this.getProfileFlag());
            await configureSet(VariableName.ACCESS_KEY_ID, credentials.AccessKeyId, this.getProfileFlag());
            await configureSet(VariableName.SECRET_ACCESS_KEY, credentials.SecretAccessKey, this.getProfileFlag());
            await configureSet(VariableName.SESSION_TOKEN, credentials.SessionToken, this.getProfileFlag());
            await configureSet(VariableName.EXPIRATION, credentials.Expiration, this.getProfileFlag());
            this.longTermAccessKeyId = this.accessKeyId;
            this.longTermSecretAccessKey = this.secretAccessKey;
            this.accessKeyId = credentials.AccessKeyId;
            this.secretAccessKey = credentials.SecretAccessKey;
            this.sessionToken = credentials.SessionToken;
            this.expiration = credentials.Expiration;
            console.log();
            console.log('Expiration: ' + new Date(credentials.Expiration).toLocaleString());
            console.log();
        } catch (e) {
            printAWSError(e.stderr || e);
            return;
        }
    }

    async setMfaSerial(mfaSerial: string) {
        await configureSet(VariableName.MFA_SERIAL, mfaSerial, this.getProfileFlag());
        this.mfaSerial = mfaSerial;
    }

    getProfileFlag(): string {
        if (this.profileName === 'default') {
            return '';
        } else {
            return this.profileName ? `--profile ${this.profileName}` : ''; // Either "--profile {profile}" or ""
        }
    }

}

function printAWSError(message: string) {
    console.log(chalk.white('AWS CLI threw error: \n' + chalk.red(message)));
}
