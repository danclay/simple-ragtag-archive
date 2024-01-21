const { processDirectory } = require("../processDir");

console.log('Fixing data...');
processDirectory('/data', true)
.then(() => {
    console.log('Fixed data');
})
.catch(console.error);