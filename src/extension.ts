'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs-extra';
import * as path from 'path';

const projectHome = "/Users/a7s14/Dev/tmp-testing";



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
    const templateRoot = path.join(context.extensionPath, "templates");
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "create-new-project" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let newProject = vscode.commands.registerCommand('extension.newProject', async () => {
        try {
            const projectName: string = await promptForNewFolder(projectHome);
            const templateName: string = await chooseTemplate();
            
            let projectPath: string;
            if(templateName !== "Empty") {
                projectPath = await copyTemplateToProject(templateName, path.join(projectHome, projectName));
            } else {
                projectPath = await createFolder(path.join(projectHome, projectName));                
            }

            const uri: vscode.Uri = vscode.Uri.file(projectPath);
            vscode.commands.executeCommand('vscode.openFolder', uri, true); 

        } catch(e) {
            const err: NodeJS.ErrnoException = e;
            vscode.window.showErrorMessage(err.message);
        }
    });

    let newProjectTemplate = vscode.commands.registerCommand('extension.newProjectTemplate', async () => {
        try {
            const templateName: string = await vscode.window.showInputBox('Template Name');
            const templatePath: string = await createFolder(path.join(templateRoot, templateName));                

            const uri: vscode.Uri = vscode.Uri.file(templatePath);
            vscode.commands.executeCommand('vscode.openFolder', uri, true); 

        } catch(e) {
            const err: NodeJS.ErrnoException = e;
            vscode.window.showErrorMessage(err.message);
        }
    });

    let editProjectTemplate = vscode.commands.registerCommand('extension.editProjectTemplate', async () => {
        try {
            const templateName: string = await chooseTemplate(false);
            const templatePath: string = getPathForTemplate(templateName);


            const uri: vscode.Uri = vscode.Uri.file(templatePath);
            vscode.commands.executeCommand('vscode.openFolder', uri, true); 

        } catch(e) {
            const err: NodeJS.ErrnoException = e;
            vscode.window.showErrorMessage(err.message);
        }
    });

    async function promptForNewFolder(root: string): Promise<string> {
        const folders = await getFoldersAtPath(root);
        const opts: vscode.InputBoxOptions = {
            prompt: "Project name",
            validateInput: function(value) {
                if(folders.indexOf(value) >= 0) {
                    return `Path ${value} already exists`;
                }

                return "";
            }
        }

        const result = await vscode.window.showInputBox(opts);
        
        return result;
    }

    function copyTemplateToProject(template: string, dest: string): Thenable<string> {
        return new Promise((resolve, reject) => {
            fs.copy(getPathForTemplate(template), dest, (err) => {
                if(err) {
                    reject(err);
                    return;
                }
                
                resolve(dest);
            });
        });
    }

    function chooseTemplate(includeBuiltIns?: boolean) {
        const folders = getAllTemplateFoldersAtPath(includeBuiltIns);
        return vscode.window.showQuickPick(folders);
    }

    function getAllTemplateFoldersAtPath(includeBuiltIns?: boolean): Thenable<string[]> {
        return getFoldersAtPath(templateRoot).then((folders) => {
            if(includeBuiltIns !== false) {
                folders.unshift("Empty Project");
            }
            return folders;
        });
    }

    function getFoldersAtPath(readPath: string): Thenable<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(readPath, (err, items) => {
                if(err) {
                    reject(err);
                    return;
                }

                const folders = items.filter((item) => fs.statSync(path.join(readPath, item)).isDirectory());
                resolve(folders);
            });
        });
    }

    function createFolder(folderName: string): Thenable<string> {
        return new Promise((resolve, reject) => {
            fs.mkdir(folderName, (err) => {
                if(err) {
                    reject(err);
                    return;
                }

                resolve(folderName);
            });
        });
    }

    function getPathForTemplate(name: string): string {
        return path.join(templateRoot, name);
    }
    

    context.subscriptions.push(newProject, newProjectTemplate, editProjectTemplate);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

