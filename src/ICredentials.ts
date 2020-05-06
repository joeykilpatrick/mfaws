export interface ICredentials {
    AccessKeyId: string,
    SecretAccessKey: string,
    SessionToken: string,
    Expiration: string,
}

export interface IJSONCredentials {
    Credentials: ICredentials
}
