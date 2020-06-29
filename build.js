// @ts-nocheck
const fs = require("fs");
const yaml = require("js-yaml");
const ncc = require("@zeit/ncc");
const path = require("path");

let diffs = undefined;
for (let i = 0; i < process.argv.length; i++) {
  if (process.argv[i] === "--diff") {
    diffs = process.argv[i + 1].split("\n");
  }
}

/** Recursively find all actions */
function findActionsToBuild(base, files, result) {
  files = files || fs.readdirSync(base);
  result = result || [];

  files.forEach((file) => {
    const newBase = path.join(base, file);
    if (fs.statSync(newBase).isDirectory()) {
      result = findActionsToBuild(newBase, fs.readdirSync(newBase), result);
    } else {
      if (file.includes("action.yml") || file.includes("action.yaml")) {
        // If diffs is defined, then only build actions in diff.
        if (!diffs || diffs.some((diffFile) => diffFile.startsWith(base))) {
          result.push(base);
        }
      }
    }
  });

  return result;
}

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
  const actionsToBuild = findActionsToBuild(".");

  for (const actionPath of actionsToBuild) {
    console.log(`Action ${actionPath}`);
    await buildAction(path.join(__dirname, `./${actionPath}`));
    console.log("");
  }
}

build();
