/**
 * @copyright Original Copyright 2012-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * @copyright Modifications Copyright 2020 Joey Kilpatrick
 *
 * Some functions in this file are modifications of code from the aws/aws-sdk-js Github repository. The
 * original code is distributed under the Apache 2.0 license. Modifications are licensed under the
 * MIT license.
 * @link https://github.com/aws/aws-sdk-js
 */

import {readFileSync, writeFileSync} from 'fs';

import {Profile, VariableName} from '../profile';

export function writeProfile(profile: Profile, credentialsFileName: string, configFileName: string): void {
    const credentialsValues: {[key: string]: string} = {
        [VariableName.ACCESS_KEY_ID]: profile.accessKeyId,
        [VariableName.SECRET_ACCESS_KEY]: profile.secretAccessKey,
        [VariableName.SESSION_TOKEN]: profile.sessionToken,
    };
    const configValues: {[key: string]: string} = {
        [VariableName.EXPIRATION]: profile.expiration,
        [VariableName.LONG_TERM_ACCESS_KEY_ID]: profile.longTermAccessKeyId,
        [VariableName.LONG_TERM_SECRET_ACCESS_KEY]: profile.longTermSecretAccessKey,
        [VariableName.MFA_SERIAL]: profile.mfaSerial,
    };

    const configProfileName: string = profile.profileName === 'default' ? 'default' :`profile ${profile.profileName}`;

    writeIniFile(credentialsFileName, profile.profileName, credentialsValues);
    writeIniFile(configFileName, configProfileName, configValues);
}

function writeIniFile(fileName: string, sectionName: string, values: {[key: string]: string}) {
    const fileString: string = readFileSync(fileName, 'utf-8');

    const lines: string[] = fileString.split(/\r?\n/);

    const newLines: string[] = [];

    let currentSection: string;
    lines.forEach((line) => {
        const splitLine: string[] = line.split(/(^|\s)[;#]/); // split comments
        const statement = splitLine[0];
        const comment = splitLine[1];
        const section: RegExpMatchArray | null = line.match(/^\s*\[([^\[\]]+)]\s*$/);
        const thisSection: string | null = section ? section[1] : null;
        if (thisSection) { // If this line is a [section] line
            if (currentSection === sectionName) { // If this line is new [section] right after the one we're looking for
                Object.entries(values).forEach(([key, value]) => { // Add the rest of the variables
                    newLines.push(`${key} = ${value}` + (comment ? ` #${comment}` : ''));
                    delete values[key];
                });
            }
            currentSection = thisSection;
            newLines.push(line);
        } else { // Else this line is not a [section] line
            if (currentSection === sectionName) { // If we are in the [section] we are looking for
                const tokens: RegExpMatchArray | null = statement.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
                if (!tokens) { // If this line is not an assignment
                    newLines.push(line);
                } else {
                    const key = tokens[1];
                    if (values[key]) {
                        newLines.push(`${key} = ${values[key]}` + (comment ? ` #${comment}` : ''));
                        delete values[key];
                    } else {
                        newLines.push(line);
                    }
                }
            } else {
                newLines.push(line);
            }
        }
    });

    writeFileSync(fileName, newLines.join('\n'));
}
