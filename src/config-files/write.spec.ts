import {assert} from 'chai';
import * as fs from 'fs';
import 'mocha';
import * as sinon from 'sinon';

import {IProfileVariables} from '../profile';
import {getProfileVariables} from './parse';
import {ConfigTestFile, CredentialsTestFile} from './samples'

let sandbox: sinon.SinonSandbox;
let writeFileSpy: sinon.SinonSpy;

describe('Writing Config Files', () => {

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(fs,'writeFileSync');
        // writeFileSpy = sandbox.spy(fs,'writeFileSync');
    });

    describe('writeProfile', () => {

        // it('should not change a profile when parse and immediately rewritten', async () => {
        //     const profileVariables = getProfileVariables(
        //         CredentialsTestFile.SIMPLE_CREDENTIALS,
        //         ConfigTestFile.SIMPLE_CONFIG,
        //     );
        //     const writeFileStrings = {
        //
        //     };
        //     [0, 1].map((callNumber) => writeFileSpy.getCall(callNumber).args)
        //         .forEach(([fileName, fileString]: [string, string]) => {
        //             writeFileStrings[fileName] = fileString;
        //         })
        // });

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

    afterEach(() => {
        sandbox.restore();
    });

});
