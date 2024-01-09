import fs from 'fs';
import { promisify } from 'util';
import axios from 'axios';
import express from 'express';
import { CronJob } from 'cron';
import RSS from 'rss';
const writeFileAsync = promisify(fs.writeFile);

const npmRegistryDomain = 'https://registry.npmjs.org';
const api = axios.create({
    baseURL: npmRegistryDomain,
    // headers: {
    //     Accept: 'application/vnd.npm.install-v1+json',
    // },
});

// {[packageName]: LatestVersion}
const dictionnary = {
    mongoose: {
        latest: '8.0.0',
        unstable: '3.9.7',
        legacy: '6.12.2',
        next: '8.0.0-rc0',
        '5x': '5.13.22',
        '6x': '6.12.5',
    },
    node: {
        latest: '21.1.0',
        'v6-lts': '6.17.1',
        'v8-lts': '8.17.0',
        'v4-lts': '4.9.1',
        'v10-lts': '10.24.1',
        'v12-lts': '12.22.12',
        'v14-lts': '14.21.3',
        'v16-lts': '16.20.2',
        'v18-lts': '18.18.2',
        'v20-lts': '20.8.0',
    },
};

const libraryWatch = ['mongoose', 'node'];

async function analyseLibrary(libraryName, rss) {
    const { data } = await api.get(`/${libraryName}`);

    /**
     * Also contain a list of all versions as keys, and release date string as values
     * @type {{modified: string, created: string}} */
    // const versions = data.time;
    // const latestPackageVersion = data['dist-tags'].latest;
    const packageTags = data['dist-tags'];
    const packageName = data._id;

    const updates = [];

    // Init
    if (!dictionnary[packageName]) {
        dictionnary[packageName] = packageTags;
    } else {
        for (const tag in packageTags) {
            if (packageTags[tag] !== dictionnary[packageName][tag]) {
                updates.push({
                    libraryName,
                    description: `[${packageName}] Tag "${tag}" update : ${dictionnary[packageName][tag]} -> ${packageTags[tag]}`,
                });
                console.info(`[${packageName}] Tag "${tag}" update : ${dictionnary[packageName][tag]} -> ${packageTags[tag]}`);
            }
        }

        dictionnary[packageName] = packageTags;
    }
    for (const upd of updates) {
        // await slackNotifier(upd.description);
        rss.item({
            date: new Date(),
            description: upd.description,
            title: `${upd.libraryName} update !`,
            url: 'none',
        });
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

new CronJob(
    '* * * * *', // cronTime
    async function () {
        console.log('trigger');
        const feed = new RSS({
            title: 'Test title !',
            description: 'A feed update on libraries',
            feed_url: 'none',
            site_url: 'none',
        });

        for (const libraryName of libraryWatch) {
            await analyseLibrary(libraryName, feed);
        }

        const xml = feed.xml({ indent: true });
        if (!fs.existsSync('./public')) {
            fs.mkdirSync('./public');
        }
        await writeFileAsync('./public' + '/rss.xml', xml);
    }, // onTick
    null, // onComplete
    true // start
);

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
