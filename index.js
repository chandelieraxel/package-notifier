import { WebClient } from '@slack/web-api';
import axios from 'axios';
import { CronJob } from 'cron';
import RSS from 'rss';

const feed = new RSS({ title: 'Test title !', feed_url: 'none', site_url: 'none' });

// Read a token from the environment variables
const token = 'xoxb-4602764007621-5915942455060-MT5KLoZMzYHfIiCe5N2bHztU';
const channels = {
    'front-app': 'C05S8UT4HJT',
    aleatoire: 'C04HQNG2K5K',
};

// Initialize
const web = new WebClient(token);
// let baseLine = new Date(2024, 0, 1);
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

const libraryWatch = ['mongoose'];

async function analyseLibrary(libraryName) {
    const { data } = await api.get(`/${libraryName}`);
    console.log('Fetching');
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
        // feed.item({
        //     date: new Date(),
        //     description: upd.description,
        //     title: `${upd.libraryName} update !`,
        //     url: 'none',
        // });
    }
    // const xml = feed.xml({ indent: true });
    // console.log('index.js line 73 ----> xml', xml);
}

async function slackNotifier(text, id = 'front-app') {
    const channel = channels[id];
    if (!channel) {
        console.warn('channel not defined', channel);
        return;
    }

    try {
        const result = await web.chat.postMessage({ text, channel });
    } catch (error) {
        console.log('index.js line 104 ----> error', error);
        console.error('Slack failed to write to channel', text, channel);
    }
}
await analyseLibrary('mongoose');

// const job = new CronJob(
//     '* * * * *', // cronTime
//     async function () {
//         console.log('trigger');
//         for (const libraryName of libraryWatch) {
//             await analyseLibrary(libraryName);
//         }
//     }, // onTick
//     null, // onComplete
//     true // start
// );

// (async () => {
//     const { data } = await api.get('/mongoose');

//     // console.log(JSON.stringify(data));
//     /**
//      * Also contain a list of all versions as keys, and release date string as values
//      * @type {{modified: string, created: string}} */
//     // const versions = data.time;
//     // const latestPackageVersion = data['dist-tags'].latest;
//     const packageTags = data['dist-tags'];
//     const packageName = data._id;

//     // Init
//     if (!dictionnary[packageName]) {
//         dictionnary[packageName] = packageTags;
//     } else {
//         for (const tag in packageTags) {
//             if (packageTags[tag] !== dictionnary[packageName][tag]) {
//                 console.info(`[${packageName}] Tag "${tag}" update : ${dictionnary[packageName][tag]} -> ${packageTags[tag]}`);
//             }
//         }

//         dictionnary[packageName] = packageTags;
//     }

//     // if (new Date(versions.modified).getTime() > baseLine.getTime()) {
//     //     for (const version in versions) {
//     //         // Skip metadata
//     //         if (version !== 'modified' && version !== 'created') {
//     //             if (new Date(versions[version]).getTime() > baseLine.getTime()) {
//     //                 console.info(`[${packageName}] New version : ${version} / ${latestPackageVersion}`);
//     //             }
//     //         }
//     //     }
//     // }

//     // baseLine = new Date();
// })();
