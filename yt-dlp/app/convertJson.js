const fs = require('fs').promises;
const path = require('path');

// Function to read a file and get its size
async function getFileSize(filename) {
    const stats = await fs.stat(filename);
    return stats.size;
}

function convertDate(date) {
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);
    return year + "-" + month + "-" + day;
}

// Function to convert the info.json file
async function convertInfoJson(mainDir, dirName, infoData, oldData) {
    archived_timestamp = new Date().toISOString();

    // Create the new structure
    const newData = {
        video_id: infoData.id,
        channel_name: infoData.uploader,
        channel_id: infoData.channel_id,
        upload_date: convertDate(infoData.upload_date),
        title: infoData.title,
        description: infoData.description,
        duration: infoData.duration,
        width: infoData.width,
        height: infoData.height,
        fps: infoData.fps,
        format_id: infoData.format_id,
        view_count: infoData.view_count,
        like_count: infoData.like_count,
        dislike_count: infoData.dislike_count || -1,
        files: [],
        archived_timestamp,
        drive_base: "fs:0"
    };
    
    if (oldData !== undefined) {
        newData.archived_timestamp = oldData.archived_timestamp;
    }

    const dirPath = path.join(mainDir, dirName);
    const filesListed = await fs.readdir(dirPath, { withFileTypes: true });
    for (const file of filesListed) {
        if (file.name.startsWith(dirName)) {
            newData.files.push({
                name: file.name,
                size: await getFileSize(path.join(dirPath, file.name))
            });
        }
    }

    return newData;
}

module.exports = { convertInfoJson }