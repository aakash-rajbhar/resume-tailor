import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
const ROOT = process.cwd();
function loadEnvFile(file){const out={};if(!existsSync(file))return out;for(const line of readFileSync(file,"utf8").split(/\r?\n/)){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;const k=t.slice(0,eq).trim();let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))||(v.startsWith('"')&&v.endsWith("'"))||(v.startsWith("'")&&v.endsWith('"')))v=v.slice(1,-1);out[k]=v;}return out;}
for(const [k,v] of Object.entries(loadEnvFile(path.join(ROOT,".env.local")))) if(!process.env[k]) process.env[k]=v;
rmSync(path.join(ROOT,".cache"),{recursive:true,force:true});
const { extractJD } = await import(path.join(ROOT,"src/lib/extractJD.ts"));
const jd = readFileSync(path.join(ROOT,"scripts/fixtures/jd.txt"),"utf8");
const r = await extractJD(jd, { extractionProvider: "groq", extractionModel: "openai/gpt-oss-20b" });
console.log(JSON.stringify({ model: r.modelUsed, fallback: r.fallbackUsed, required: r.jd.required_skills, preferred: r.jd.preferred_skills, other: r.jd.other_requirements, education: r.jd.education_requirement }, null, 2));
