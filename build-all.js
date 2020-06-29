// @ts-nocheck
const fs = require("fs");
const yaml = require("js-yaml");
const ncc = require("@zeit/ncc");
const path = require("path");

const actionsToBuild = ["use-ssh", "git-diff-check"];

async function buildAction(path) {
  const doc = yaml.safeLoad(fs.readFileSync(`${path}/action.yml`, "utf8"));
  const entryPoints = [doc.runs.pre, doc.runs.main, doc.runs.post];

  for (const entryPoint of entryPoints) {
    if (!entryPoint || !entryPoint.startsWith("dist/")) continue;
    console.log(`Building script ${entryPoint}`);

    const inputFile = entryPoint.replace("dist/", `${path}/`).replace(".js", ".ts");
    const { code } = await ncc(inputFile, {
      minify: false,
      sourceMap: false,
      quiet: true,
    });

    if (!fs.existsSync(`${path}/dist`)) {
      fs.mkdirSync(`${path}/dist`);
    }
    fs.writeFileSync(`${path}/${entryPoint}`, code, "utf8");
  }
}

async function build() {
  for (const actionPath of actionsToBuild) {
    console.log(`Action ${actionPath}`);
    await buildAction(path.join(__dirname, `./${actionPath}`));
    console.log("");
  }
}

build();
