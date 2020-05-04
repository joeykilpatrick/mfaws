import {exec} from "child-process-promise";

export async function configGet(varname: string, profileFlagString: string): Promise<string> {
    try {
        return (await exec(`aws configure get ${varname} ${profileFlagString}`)).stdout.trim();
    } catch (e) {
        return "";
    }
}
export async function configSet(varname: string, value: string, profileFlagString: string): Promise<void> {
    await exec(`aws configure set ${varname} ${value} ${profileFlagString}`);
}
