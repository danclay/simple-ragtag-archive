const { getChannels } = require('./getChannels');
const { processDirectory } = require('./processDir');
const YTDlpWrap = require('yt-dlp-wrap').default;
const cron = require('node-cron');
const fs = require('fs');

const ytDlpDefaultArgs = [
    "-o",
    "/data/%(id)s/%(id)s.%(ext)s"
]

const ytDlpArgs = process.env.YTDLP_ARGS.split(' ');
const ytDlpWrap = new YTDlpWrap('yt-dlp');

let running = false;

const run = async () => {
    if (running) {
        console.log(`Skipping run at ${new Date().toISOString()} due to previous run still in progress`);
        return;
    }
    running = true;

    const channels = await getChannels('/config/channels.txt').catch(console.error);
    if (!channels) {
        console.log('No channels in file');
        running = false;
        return;
    }

    // check if archive.txt exists, create if not.
    await new Promise((resolve) => {
        fs.access('/appdata/archive.txt', fs.constants.F_OK, (err) => {
            if (err) {
                fs.writeFile('/appdata/archive.txt', '', (err) => {
                    if (err) {
                        console.error(err);
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    });

    if (channels.length > 0) {
        const argsTotal = ytDlpArgs.concat(ytDlpDefaultArgs, ytDlpArgs, channels);

    console.log('Starting download of videos');
    await new Promise((resolve, reject) => {
        const ytDlpEventEmitter = ytDlpWrap
            .exec(argsTotal);

        ytDlpEventEmitter.on('progress', (progress) =>
            console.log(
                progress.percent,
                progress.totalSize,
                progress.currentSpeed,
                progress.eta
            )
        );
        ytDlpEventEmitter.on('ytDlpEvent', (eventType, eventData) =>
            console.log(eventType, eventData)
        );
        ytDlpEventEmitter.on('error', (error) => reject(error));
        ytDlpEventEmitter.on('close', () => resolve());
    }).catch(console.error);
    } else {
        console.log('No channels in file to archive. Skipping yt-dlp run.');
    }

    console.log('Finished downloading videos. Regardless of fail or success, will process directory');

    await processDirectory('/data').catch(console.error);

    console.log(`Done. Next run: ${process.env.CRON_SCHEDULE}`);
    running = false;
};

const valid = cron.validate(process.env.CRON_SCHEDULE);
if (!valid) {
    throw "Invalid cron schedule";
}

if (process.env.RUN_ON_STARTUP.toLowerCase().trim() == "true") {
    console.log("Running on startup");
    run();
}

console.log(`Starting cron schedule: ${process.env.CRON_SCHEDULE}`);
cron.schedule(process.env.CRON_SCHEDULE, () => {
    // check if updating. If so, delay.
    const check = () => {
        fs.access('/tmp/updater-running', fs.constants.F_OK, (err) => {
            if (err) {
                run();
            } else {
                setTimeout(check, 1000);
            }
        });
    }
});