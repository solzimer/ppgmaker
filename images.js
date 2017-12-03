const
	promisify = require("util").promisify,
	program = require("commander"),
	im = require("imagemagick"),
	convert = promisify(im.convert),
	fs = require("fs-extra");

program
  .version('0.1.0')
  .option('-p, --path [path]', 'Path')
  .parse(process.argv);

const path = program.path;
const paths = [{n:"xl",w:"640x640"},{n:"sm",w:"200x200"}];

Promise.
	all(paths.map(p=>fs.ensureDir(`${path}/${p.n}`))).
	then(()=>{
		return fs.readdir(`${path}`)
	}).
	then(files=>{
		return files.filter(f=>f.endsWith(".png"));
	}).
	then(files=>{
		return Promise.all(paths.map(p=>{
			return Promise.all(
				files.map(f=>convert([`${path}/${f}`,'-trim','-resize', p.w, `${path}/${p.n}/${f}`]))
			);
		}));
	}).
	then(res=>{
		console.log("DONE!");
	},err=>{
		console.error(err);
	});
