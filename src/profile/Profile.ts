import * as AWS from 'aws-sdk';

import {getProfileVariables, writeProfile} from '../config-files';
import {promptForMFASerial} from '../prompts';
import {IProfileVariables} from './IProfileVariables';
import {VariableName} from './VariableName';

export type ProfileVariable =  string | null;

export class Profile {
    public accessKeyId: ProfileVariable = null;
    public secretAccessKey: ProfileVariable = null;
    public sessionToken: ProfileVariable = null;
    public expiration: ProfileVariable = null;
    public longTermAccessKeyId: ProfileVariable = null;
    public longTermSecretAccessKey: ProfileVariable = null;
    public mfaSerial: ProfileVariable = null;

    public readonly profileName: string;
    public readonly credentialsFilePath: string;
    public readonly configFilePath: string;

    constructor(profileName: string, credentialsFilePath: string, configFilePath: string) {
        this.credentialsFilePath = credentialsFilePath;
        this.configFilePath = configFilePath;
        this.profileName = profileName;
        const profileVariables: IProfileVariables = getProfileVariables(credentialsFilePath, configFilePath);
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
        return !!this.longTermAccessKeyId;
    }

    public async restoreLongTermCredentials(): Promise<void> {
        if (this.longTermCredentialsSet()) {
            this.accessKeyId = this.longTermAccessKeyId;
            this.secretAccessKey = this.longTermSecretAccessKey;
            this.sessionToken = null;
            this.expiration = null;
            this.longTermAccessKeyId = null;
            this.longTermSecretAccessKey = null;
        } else {
            console.log('No long-term credentials found to restore.');
        }
        writeProfile(this, this.credentialsFilePath, this.configFilePath);
    }

    async setNewShortTermCredentials(tokenCode: string, duration: number): Promise<void> {
        // Restore first, if already MFA authenticated
        const alreadySet: boolean = !!this.sessionToken;
        if (alreadySet) {
            await this.restoreLongTermCredentials();
        }

        if (!this.mfaSerial) {
            this.mfaSerial = await promptForMFASerial();
        }

        const sts: AWS.STS = new AWS.STS({credentials: new AWS.SharedIniFileCredentials({profile: this.profileName})});
        const credentials: AWS.STS.Credentials | undefined = (await sts.getSessionToken({
            DurationSeconds: duration,
            SerialNumber: this.mfaSerial,
            TokenCode: tokenCode,
        }).promise()).Credentials; // TODO Catch error properly
        if (!credentials) {
            throw Error('Call to STS failed.')
        }

        this.longTermAccessKeyId = this.accessKeyId;
        this.longTermSecretAccessKey = this.secretAccessKey;
        this.accessKeyId = credentials.AccessKeyId;
        this.secretAccessKey = credentials.SecretAccessKey;
        this.sessionToken = credentials.SessionToken;
        this.expiration = credentials.Expiration.toLocaleString();

        writeProfile(this, this.credentialsFilePath, this.configFilePath);

        console.log();
        console.log('Expiration: ' + credentials.Expiration.toLocaleString());
        console.log();
    }

}
