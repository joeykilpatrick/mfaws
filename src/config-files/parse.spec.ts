import {assert} from 'chai';
import 'mocha';

import {IProfileVariables} from '../profile';
import {
    getProfileVariables,
    parseConfigFile,
    parseCredentialFile,
} from './parse';
import {ConfigTestFile, CredentialsTestFile} from './samples'

describe('Parsing Config Files', () => {

    describe('getProfileVariables', () => {

        it('should merge the values of a profile', async () => {
            const profileVariables = getProfileVariables(
                CredentialsTestFile.SIMPLE_CREDENTIALS,
                ConfigTestFile.SIMPLE_CONFIG,
            );
            assert.deepEqual<IProfileVariables>(profileVariables, {
                default: {
                    aws_access_key_id : 'TEST_KEY_ID',
                    aws_secret_access_key : 'TEST_ACCESS_KEY',
                    aws_session_token : 'TEST_TOKEN',
                    output: 'json',
                    region: 'us-east-1',
                },
            })
        });

        it('should use credential file values in case of conflict', async () => {
            const profileVariables = getProfileVariables(
                CredentialsTestFile.SIMPLE_CREDENTIALS,
                ConfigTestFile.CONFLICTING_CONFIG,
            );
            assert.deepEqual<IProfileVariables>(profileVariables, {
                default: {
                    aws_access_key_id : 'TEST_KEY_ID',
                    aws_secret_access_key : 'TEST_ACCESS_KEY',
                    aws_session_token : 'TEST_TOKEN',
                    output: 'json',
                    region: 'us-east-1',
                },
            })
        });

        it('should include profiles found in either file', async () => {
            const profileVariables = getProfileVariables(
                CredentialsTestFile.MULTIPLE_CREDENTIALS,
                ConfigTestFile.SIMPLE_CONFIG,
            );
            assert.deepEqual<IProfileVariables>(profileVariables, {
                default: {
                    output: 'json',
                    region: 'us-east-1',
                },
                first_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_1',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_1',
                    aws_session_token : 'TEST_TOKEN_1',
                },
                second_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_2',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_2',
                    aws_session_token : 'TEST_TOKEN_2',
                },
                third_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_3',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_3',
                    aws_session_token : 'TEST_TOKEN_3',
                },
            })
        });

    });

    describe('parseCredentialFile', () => {

        it('should parse a simple credentials file', async () => {
            const profileVariables = parseCredentialFile(CredentialsTestFile.SIMPLE_CREDENTIALS);
            assert.deepEqual<IProfileVariables>(profileVariables, {
                default: {
                    aws_access_key_id : 'TEST_KEY_ID',
                    aws_secret_access_key : 'TEST_ACCESS_KEY',
                    aws_session_token : 'TEST_TOKEN',
                },
            })
        });

        it('should parse a credentials file with multiple profiles', async () => {
            const profileVariables = parseCredentialFile(CredentialsTestFile.MULTIPLE_CREDENTIALS);
            assert.deepEqual<IProfileVariables>(profileVariables, {
                first_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_1',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_1',
                    aws_session_token : 'TEST_TOKEN_1',
                },
                second_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_2',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_2',
                    aws_session_token : 'TEST_TOKEN_2',
                },
                third_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_3',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_3',
                    aws_session_token : 'TEST_TOKEN_3',
                },
            })
        });

        it('should parse a credentials file with comments on any line', async () => {
            const profileVariables = parseCredentialFile(CredentialsTestFile.COMMENTED_CREDENTIALS);
            assert.deepEqual<IProfileVariables>(profileVariables, {
                first_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_1',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_1',
                    aws_session_token : 'TEST_TOKEN_1',
                },
                second_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_2',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_2',
                    aws_session_token : 'TEST_TOKEN_2',
                },
            })
        });

        it('should parse a credentials file with no spaces around the \'=\'', async () => {
            const profileVariables = parseCredentialFile(CredentialsTestFile.NO_SPACE_CREDENTIALS);
            assert.deepEqual<IProfileVariables>(profileVariables, {
                default: {
                    aws_access_key_id : 'TEST_KEY_ID',
                    aws_secret_access_key : 'TEST_ACCESS_KEY',
                    aws_session_token : 'TEST_TOKEN',
                },
            })
        });

        it('should parse a credentials file with blank lines on any line', async () => {
            const profileVariables = parseCredentialFile(CredentialsTestFile.BLANK_LINES_CREDENTIALS);
            assert.deepEqual<IProfileVariables>(profileVariables, {
                first_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_1',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_1',
                    aws_session_token : 'TEST_TOKEN_1',
                },
                second_profile: {
                    aws_access_key_id : 'TEST_KEY_ID_2',
                    aws_secret_access_key : 'TEST_ACCESS_KEY_2',
                    aws_session_token : 'TEST_TOKEN_2',
                },
            })
        });

        it('should ignore lines without a profile header', async () => {
            const profileVariables = parseCredentialFile(CredentialsTestFile.NO_PROFILE_CREDENTIALS);
            assert.deepEqual<IProfileVariables>(profileVariables, {})
        });

    });

    describe('parseConfigFile', () => {
        it('should parse a simple config file', async () => {
            const profileVariables = parseConfigFile(ConfigTestFile.SIMPLE_CONFIG);
            assert.deepEqual<IProfileVariables>(profileVariables, {
                default: {
                    output: 'json',
                    region: 'us-east-1',
                },
            })
        });
    });

});
