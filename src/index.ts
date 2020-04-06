import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';
import { ExecOptions } from '@actions/exec/lib/interfaces';

// names of the input parameters
const PARAM_IN_WORKING_DIRECTORY = 'working-directory';
const PARAM_IN_SCRIPT_NAME = 'script-name';
// names of the output parameters
const PARAM_OUT_INSTALLER_PATH = 'installer-path';
const PARAM_OUT_INSTALLER_FILE_NAME = 'installer-file-name';
const PARAM_OUT_INSTALLER_SIMPLE_FILE_NAME = 'installer-simple-file-name';

// general constants
const INNO_SETUP = 'iscc';
const NEW_LINE = '\n';
const EMPTY_STRING = '';

async function run() {
    try {
        // According to the following links:
        // https://github.com/actions/virtual-environments/blob/master/images/win/Windows2016-Readme.md
        // https://github.com/actions/virtual-environments/blob/master/images/win/Windows2019-Readme.md
        // The Inno Setup is installed on both supported Windows versions and that is the reason
        // why this script doesn't check if the Inno Setup exists

        // first check if the image is not valid to skip the rest of the action
        if(process.platform !== "win32") {
            core.setFailed("Inno Setup only works on Windows platforms.");
            return;
        }

        const workingDirectory = core.getInput(PARAM_IN_WORKING_DIRECTORY);
        const scriptName = core.getInput(PARAM_IN_SCRIPT_NAME);
        // temp variable which will contain a full path to the installer script
        const fullPath = path.join(workingDirectory, scriptName);
        // check if the path of the script doesn't exist to skip the rest of the action
        // and set that the action is failed
        if(!fs.existsSync(fullPath)) {
            core.setFailed(`The script doesn't exist on the following path ${scriptName}`);
            return;
        }

        // temp variable which will contain all data which the Inno Setup
        // sends to the standard output so we can later parse that data and find
        // the path of the newly created installer
        var outputFromISCC = EMPTY_STRING;
        // here the redirection of the stanard output of the Inno Setup is set
        // so we can parse output data to find the path of the newly created installer
        const options: ExecOptions = {};
        options.listeners = {
            stdout: (data: Buffer) => {
                var output = data.toString();
                outputFromISCC += output;
            }
        };

        // try to execute the installer script and wait for the result
        const result = await exec.exec(INNO_SETUP, [fullPath], options);
        // check if execution of the script failed and in that case stop the action
        if( result != 0) {
            // https://jrsoftware.org/ishelp/index.php?topic=compilercmdline
            const reason = result == 1 ? 'the command line parameters were invalid or an internal error occurred' :
                'the compile failed';
            core.setFailed(`The script on the path ${fullPath} failed. Inno Setup exit code is ${result} (${reason}).\r\nInno Setup output ${outputFromISCC}`);
            return;
        }

        // temp array which will contain all lines of the Inno Setup output
        // this is the only way to get information about the path of the newly created installer
        const outputFromISCCArray = outputFromISCC.split(NEW_LINE);

        // in this loop is searching for the first line which is not empty, because
        // in the output of the Inno Setup last not empty line is a path of 
        // the newly created installer
        let index = outputFromISCCArray.length - 1;
        for(; index > 0; --index) {
            if(outputFromISCCArray[index].trim() != EMPTY_STRING) {
                break;
            }
        }
        
        // temp variable which should contains the path of the newly created installer
        const installerPath = outputFromISCCArray[index].trim();
        // set values to the output parameters
        core.setOutput(PARAM_OUT_INSTALLER_PATH, installerPath);
        core.setOutput(PARAM_OUT_INSTALLER_FILE_NAME, path.basename(installerPath));
        core.setOutput(PARAM_OUT_INSTALLER_SIMPLE_FILE_NAME, 
            path.basename(installerPath).replace(path.extname(installerPath), EMPTY_STRING));
    } catch(error) {
        core.setFailed(error);
    }
}

run();