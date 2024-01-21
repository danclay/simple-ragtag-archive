const fs = require('fs');
const readline = require('readline');

const getChannels = (inFile) => {
    // Create a stream to read the file
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(inFile);

        // Create an interface to read the file line by line
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity // Recognize all instances of CR LF ('\r\n') as a single line break.
        });
    
        const lines = []; // Array to hold the lines
    
        // Event listener for each line of the file
        rl.on('line', (line) => {
            lines.push(line); // Add the line to the array
        });
    
        // Event listener for the completion of file reading
        rl.on('close', () => {
            resolve(lines);
        });
    
        // Handle any errors while reading the file
        fileStream.on('error', (error) => {
            reject(error);
        });
    });
}

module.exports = {getChannels};