import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, renameSync } from "node:fs";
import { join, resolve, relative, basename } from "node:path";

const args = process.argv.slice(2);
const root = args.length === 2 && args[0] === "--root" ? resolve(args[1]) : process.cwd();
const keys = ["statements", "branches", "functions", "lines"];
function testFiles(directory) {
  return readdirSync(directory, {withFileTypes:true}).flatMap(entry => entry.isDirectory()
    ? testFiles(join(directory,entry.name))
    : /\.test\.tsx?$/.test(entry.name) ? [resolve(directory,entry.name)] : []);
}
function totals(record) {
  for (const key of keys) {
    const item=record?.[key];
    if (!item || !Number.isInteger(item.covered) || !Number.isInteger(item.total) || item.total<0 || item.covered<0 || item.covered>item.total) throw new Error("Ungültige Coverage-Messwerte.");
  }
  return Object.fromEntries(keys.map(key=>[key,record[key].total===0 ? 100 : Math.floor(record[key].covered/record[key].total*10_000)/100]));
}
try {
  if (args.length && !(args.length===2 && args[0]==="--root")) throw new Error("Nur vollständige Testläufe dürfen veröffentlicht werden.");
  const summary=JSON.parse(readFileSync(join(root,"coverage/coverage-summary.json"),"utf8"));
  const reportPath=join(root,"coverage/test-results.json");
  const report=JSON.parse(readFileSync(reportPath,"utf8"));
  if (!report.success || report.numFailedTests!==0 || !Number.isInteger(report.numTotalTests) || report.numTotalTests<1 || !Array.isArray(report.testResults)) throw new Error("Kein erfolgreicher vollständiger Testlauf vorhanden.");
  const expected=new Set(testFiles(join(root,"tests/unit")));
  const actual=new Set(report.testResults.map(file=>resolve(root,file.name)));
  if (expected.size!==actual.size || [...expected].some(file=>!actual.has(file))) throw new Error("Unvollständiger Testlauf: Testdateien fehlen.");
  const library=Object.entries(summary).filter(([file])=>relative(root,file).replaceAll("\\","/").startsWith("src/lib/"));
  if (!library.length) throw new Error("Keine Messdaten für src/lib vorhanden.");
  const aggregate=Object.fromEntries(keys.map(key=>[key,{total:0,covered:0}]));
  for (const [,record] of library) { totals(record); for(const key of keys){aggregate[key].total+=record[key].total;aggregate[key].covered+=record[key].covered;} }
  const areas=new Map();
  for (const file of report.testResults) {
    const local=relative(root,resolve(root,file.name)).replaceAll("\\","/");
    const area=local.startsWith("tests/unit/api/")?"API-Routen":local.startsWith("tests/unit/components/")?"Komponenten":local.startsWith("tests/unit/lib/")?"Bibliotheken":local.startsWith("tests/unit/scripts/")?"Skripte":"Weitere Tests";
    const entry=areas.get(area) ?? {area,files:0,tests:0,modules:[]};
    entry.files++; entry.tests+=file.assertionResults.length; entry.modules.push(basename(local).replace(/\.test\.tsx?$/,""));areas.set(area,entry);
  }
  const snapshot={schemaVersion:1,version:JSON.parse(readFileSync(join(root,"package.json"),"utf8")).version,measuredAt:statSync(reportPath).mtime.toISOString(),coverage:totals(summary.total),libraryCoverage:totals(aggregate),tests:{total:report.numTotalTests,files:actual.size,allPassing:true,apiRouteTests:areas.get("API-Routen")?.tests ?? 0,byArea:[...areas.values()]}};
  const directory=join(root,"src/data");mkdirSync(directory,{recursive:true});
  const output=join(directory,"quality-metrics.json");writeFileSync(`${output}.tmp`,JSON.stringify(snapshot,null,2)+"\n");renameSync(`${output}.tmp`,output);
  console.log("Qualitätsmessung für das Deployment aktualisiert.");
} catch (error) {
  console.error(`Qualitätsmessung nicht aktualisiert: ${error.message}`);
  process.exitCode=1;
}
