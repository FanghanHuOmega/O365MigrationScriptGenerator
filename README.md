# O365 Migration Script Generator

This is a standalone web app for generating migration scripts to migrate data between Pims R4 and Omega 365.

This app will generate SQL scripts based on a migration profile the user provides. profiles and scripts generated is saved locally on the user's browser. user can modify the generated script and save it. Once satisfied with the scirpt, the user can copy the script and execute it in SSMS or other sql clients. While this app is capable of storing scripts, it is still recommended to keep your generated scripts in a separate repository for sharing and version tracking.

Compare to dynamic sql queries, this tool is easier to modify, the generated script is easier to debug.

## Getting Started

### For Users:
The project is hosted on Github pages:


### For Devs:
**Make sure you use branches and pull requests, do not commit directly to the main branch.**

You need to install dependencies if it is the first time you are setting up the project.
```bash
npm install
```

Start the dev server with the following command
```bash
npm run dev
```

A recommended vscode extention to use for this project is: qufiwefefwoyn.inline-sql-syntax

To publish your changes, test your changes first then initiate a pull request. the changes will be automatically deployed to Github Pages once the pull request is merged.