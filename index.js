require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const mpdParser = require('mpd-parser');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', async () => {
  console.log('Up and running :)');
});

const getVideoURL = async (baseUrl) => {
  try {
    const mainPageRes = await axios.get(baseUrl);
    const landingUrl = mainPageRes.request.res.responseUrl;
    const paramStartIndex = landingUrl.indexOf('/?');
    const realUrl = landingUrl.slice(0, paramStartIndex);
    const jsonUrl = realUrl + '.json';
    const jsonRes = await axios.get(jsonUrl);
    const videoUrl =
      jsonRes.data[0].data.children[0].data.media.reddit_video.fallback_url.replace(
        '?source=fallback',
        ''
      );
    return videoUrl;
  } catch {
    return null;
  }
};

const getAudioURL = async (videoUrl) => {
  try {
    const splitIndex = videoUrl.lastIndexOf('/');
    const baseURL = videoUrl.slice(0, splitIndex);
    const res = await axios.get(baseURL + '/DASHPlaylist.mpd');
    const parsedManifest = mpdParser.parse(res.data);
    const audioURI =
      parsedManifest.mediaGroups.AUDIO.audio.main.playlists.slice(-1)[0]
        .resolvedUri;
    return baseURL + audioURI;
  } catch {
    return null;
  }
};

const createVideo = async (url) => {
  const videoURL = await getVideoURL(url);
  if (!videoURL) return null;
  const audioURL = await getAudioURL(videoURL);
  if (!audioURL) return null;
  return videoURL;
};

client.on('messageCreate', (message) => {
  try {
    const msgParts = message.content.split(' ');
    msgParts.forEach((str) => {
      if (str.includes('reddit.com/r')) {
        createVideo(str).then((url) =>
          url ? message.channel.send(url) : message.react('❌')
        );
      }
    });
  } catch {}
});

client.login(process.env.TOKEN);
