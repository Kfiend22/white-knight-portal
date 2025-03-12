// port-manager.js
// Script to manage port conflicts for the backend server

const { exec, spawn } = require('child_process');
const readline = require('readline');
const path = require('path');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default port
const DEFAULT_PORT = 5000;

// Function to check if a port is in use
const checkPort = (port) => {
  return new Promise((resolve) => {
    // Different commands for different operating systems
    const command = process.platform === 'win32' 
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error || stderr || !stdout) {
        // Port is not in use
        resolve({ inUse: false });
        return;
      }
      
      // Port is in use
      let pid = null;
      
      if (process.platform === 'win32') {
        // Extract PID from Windows netstat output
        const match = stdout.match(/LISTENING\s+(\d+)/);
        if (match && match[1]) {
          pid = match[1];
        }
      } else {
        // Extract PID from Unix lsof output
        const match = stdout.match(/\S+\s+(\d+)/);
        if (match && match[1]) {
          pid = match[1];
        }
      }
      
      resolve({ inUse: true, pid });
    });
  });
};

// Function to kill a process by PID
const killProcess = (pid) => {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32'
      ? `taskkill /F /PID ${pid}`
      : `kill -9 ${pid}`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Failed to kill process: ${error.message}`);
        return;
      }
      
      resolve(`Process ${pid} killed successfully`);
    });
  });
};

// Function to start the server on a specific port
const startServer = (port) => {
  console.log(`Starting server on port ${port}...`);
  
  // Set environment variables
  const env = { ...process.env, PORT: port };
  
  // Start the server
  const serverPath = path.join(__dirname, 'backend', 'server.js');
  const server = spawn('node', [serverPath], { 
    env,
    stdio: 'inherit' // This will pipe the child process's stdout and stderr to the parent process
  });
  
  // Handle server exit
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    process.exit(code);
  });
  
  // Handle errors
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
};

// Main function
const main = async () => {
  try {
    console.log('Checking if default port is in use...');
    const { inUse, pid } = await checkPort(DEFAULT_PORT);
    
    if (!inUse) {
      console.log(`Port ${DEFAULT_PORT} is available.`);
      rl.question(`Start server on port ${DEFAULT_PORT}? (Y/n) `, (answer) => {
        if (answer.toLowerCase() !== 'n') {
          rl.close();
          startServer(DEFAULT_PORT);
        } else {
          rl.question('Enter alternative port: ', (port) => {
            rl.close();
            startServer(parseInt(port, 10) || 5001);
          });
        }
      });
      return;
    }
    
    console.log(`Port ${DEFAULT_PORT} is in use by process ID: ${pid || 'unknown'}`);
    console.log('Options:');
    console.log('1. Kill the process and use port 5000');
    console.log('2. Use a different port');
    
    rl.question('Select option (1/2): ', async (option) => {
      if (option === '1') {
        if (!pid) {
          console.log('Cannot kill process: PID not found');
          rl.question('Enter alternative port: ', (port) => {
            rl.close();
            startServer(parseInt(port, 10) || 5001);
          });
          return;
        }
        
        try {
          const result = await killProcess(pid);
          console.log(result);
          rl.close();
          startServer(DEFAULT_PORT);
        } catch (error) {
          console.error(error);
          rl.question('Enter alternative port: ', (port) => {
            rl.close();
            startServer(parseInt(port, 10) || 5001);
          });
        }
      } else {
        rl.question('Enter alternative port: ', (port) => {
          rl.close();
          startServer(parseInt(port, 10) || 5001);
        });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

// Run the main function
main();
