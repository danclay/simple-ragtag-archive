# simple-ragtag-archive
 Simple Docker stack to archive Ragtag Archive

This was very much just thrown together and will be improved over time. 

Ideas from [Jeeaaasus/youtube-dl](https://github.com/Jeeaaasus/youtube-dl) and [aonahara/archive-docker](https://gitlab.com/aonahara/archive-docker)

## Setup

1. Install Docker and run `git clone https://github.com/danclay/simple-ragtag-archive.git`

2. Copy `.env.example` to `.env` (run `cp .env.example .env`) and edit `.env` to your desired values. Alternatively, you can just replace the variable references in `docker-compose.yaml` directly for a more complex setup. Please only change `YTDLP_ARGS` if you know what you are doing. Read the [Ragtag Archive Github](https://github.com/ragtag-archive/archive-browser) first.

3. If you want to serve to a specific domain, set up your nginx config in `./nginx`. This maps to `/etc/nginx/conf.d`.

4. Put video/channel URLs for yt-dlp in `channels.txt` in this root directory. One URL per line and use channel IDs. `See channels.txt.example for an idea of this.`

5. If you want to archive private videos, etc. please customize `YTDLP_ARGS` and `docker-compose.yaml`.

### Initialize 

 For new installs. Skip if docker volume "esdata" exists.

1. Run `docker compose build` or `docker compose build --no-cache` if major changes occurred

2. Run `docker compose up archive-browser elastic nginx -d`

3. Run `docker compose exec archive-browser node /app/doc/create_indices.js http://elastic:9200`. If you get an error, e.g. TypeError: Cannot read property 'data' of undefined, it means Elasticsearch is still initializing. Wait a few minutes and try to run the command again.

### Run

1. Run `docker compose build`

2. Run `docker compose up -d`

## Notes

- Please keep your `appdata` directory so yt-dlp's archive.txt is preserved. A script will be made in the future to recover this file from elastic search

## Post-update / Fixing Data

If the ID.db.json files are incorrect and this has been fixed in a version or if you just want the data pushed to Elastic Search, run `docker compose exec ytdlp node /app/scripts/fixData.js`. 