/**
 * @copyright Original Copyright 2012-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * @copyright Modifications Copyright 2020 Joey Kilpatrick
 *
 * Some functions in this file are modifications of code from the aws/aws-sdk-js Github repository. The
 * original code is distributed under the Apache 2.0 license. Modifications are licensed under the
 * MIT license.
 * @link https://github.com/aws/aws-sdk-js
 */

import {readFileSync} from 'fs';

import {IProfileVariables} from '../profile';

export function getProfileVariables(credentialsFileName: string, configFileName: string): IProfileVariables {
    const credentials: IProfileVariables = parseCredentialFile(credentialsFileName);
    const config: IProfileVariables = parseConfigFile(configFileName);

    Object.entries(credentials).forEach(([profile, variables]) => {
        if (!config[profile]) {
            config[profile] = {};
        }
        Object.entries(variables).forEach(([varname, value]) => {
            config[profile][varname] = value;
        });
    });

    return config;
}

/**
 * Parses a AWS credentials file into a set of profiles and their associated variables.
 *
 * @param filename Path of file to parse
 *
 * Original code from aws/aws-sdk-js repository:
 * @link https://github.com/aws/aws-sdk-js/blob/c2ad3ef8fd486bb58edc225f74152dda51f9f2fe/lib/util.js
 */
export function parseCredentialFile(filename: string): IProfileVariables {
    // 1. Read file
    const fileString = readFileSync(filename, 'utf-8');

    // 2. Split into lines
    const lines: string[] = fileString.split(/\r?\n/);

    // 3. Loop over lines to populate IProfileVariables object
    const profileVariables: IProfileVariables = {};
    let currentProfile: string;
    lines.forEach((line: string) => {
        line = line.split(/(^|\s)[;#]/)[0]; // remove comments
        const section: RegExpMatchArray | null = line.match(/^\s*\[([^\[\]]+)]\s*$/);
        const profile: string | null = section ? section[1] : null;
        if (profile) { // If this line is a [profile] line
            currentProfile = profile;
        } else if (currentProfile) { // If this line is a variable
            const item = line.match(/^\s*(.+?)\s*=\s*(.+?)\s*$/);
            if (item) {
                profileVariables[currentProfile] = profileVariables[currentProfile] || {};
                profileVariables[currentProfile][item[1]] = item[2];
            }
        }
    });
    return profileVariables;
}

/**
 * Parses a AWS config file into a set of profiles and their associated variables.
 *
 * @param filename Path of file to parse
 *
 * Original code from aws/aws-sdk-js repository:
 * @link https://github.com/aws/aws-sdk-js/blob/cb1604ca89a077ffdb86127884292d3b18c8b4df/lib/shared-ini/ini-loader.js
 */
export function parseConfigFile(filename: string): IProfileVariables {
    // 1. Parse in the same way as the credentials file
    const profileVariables: IProfileVariables = parseCredentialFile(filename);

    // 2. Remove the string 'profile' from each profile name
    const newProfileVariables: IProfileVariables = {};
    Object.keys(profileVariables).forEach((profileName) => {
        const profileContent = profileVariables[profileName];
        profileName = profileName.replace(/^profile\s/, '');
        Object.defineProperty(newProfileVariables, profileName, {
            enumerable: true,
            value: profileContent,
        });
    });
    return newProfileVariables;
}
