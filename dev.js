const { spawn } = require('child_process');

function run(label, command, args, cwd) {
  const proc = spawn(command, args, { cwd, shell: true });
  
  proc.stdout.on('data', (data) => {
    console.log(`[${label}] ${data.toString().trim()}`);
  });
  
  proc.stderr.on('data', (data) => {
    console.error(`[${label}] ERROR: ${data.toString().trim()}`);
  });
  
  proc.on('close', (code) => {
    console.log(`[${label}] Process exited with code ${code}`);
  });

  return proc;
}

console.log("Starting AdoptMe front and back servers...");
const back = run("BACKEND", "npm", ["run", "dev"], "./back");
const front = run("FRONTEND", "npm", ["run", "dev"], "./front");

process.on('SIGINT', () => {
  console.log("Stopping servers...");
  back.kill();
  front.kill();
  process.exit();
});
