require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', () => {
  console.log('Up and running :)');
});

const getVideoUrl = async (url) => {
  try {
    const mainPageRes = await axios.get(url);
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

client.on('messageCreate', (message) => {
  try {
    const msgParts = message.content.split(' ');
    msgParts.forEach((str) => {
      if (str.includes('reddit.com/r')) {
        getVideoUrl(str).then((url) => url && message.channel.send(url));
      }
    });
  } catch {}
});

client.login(process.env.TOKEN);
