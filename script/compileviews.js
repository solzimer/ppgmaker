const
	promisify = require("util").promisify;
	fs = require("fs");

const
	BASE = '../static/views',
	OUT = '../static/src/model/templates.js',
	readdir = promisify(fs.readdir),
	readFile = promisify(fs.readFile),
	writeFile = promisify(fs.writeFile);

function readTemplates() {
	return readdir(BASE).
		then(list=>list.filter(f=>f.endsWith('.html'))).
		then(list=>list.map(f=>{
			return readFile(`${BASE}/${f}`,'utf-8').
				then(c=>{return {f:f.split(".")[0],c:c}});
		})).
		then(prs=>Promise.all(prs));
}

function compileTemplates(tmpls) {
	let strs = tmpls.map(tmpl=>`\tthis.${tmpl.f} = ${JSON.stringify(tmpl.c)}`);
	return readFile('./data/templates.tmpl','utf-8').
		then(f=>f.split("${templates}").join(strs.join(";\n"))).
		then(f=>writeFile(OUT,f));
}

readTemplates().
	then(tmpls=>compileTemplates(tmpls)).
	then(res=>console.log("Completed!")).
	catch(err=>console.error(err));
