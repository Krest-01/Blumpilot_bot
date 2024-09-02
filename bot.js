import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

const play = 5;
const botToken = '6301224962:AAH0xlCXPsxeUpBAaN8vJqiDhwOO7b-C9Yw'; // Replace with your actual bot token
const bot = new TelegramBot(botToken, { polling: true });

// Maps to store user tokens and game state, using chat IDs as keys
const userTokens = {};
const activeGames = {};

// Function to exchange referral link for an authorization token
async function getTokenFromReferral(referralLink) {
  try {
    const response = await fetch('https://api.blum.codes/referral-to-token', { // Replace with actual endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ referralLink: referralLink }),
    });

    if (!response.ok) throw new Error('Failed to retrieve token from referral link.');

    const data = await response.json();
    return data.token; // Adjust based on actual response format
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Main function to play and claim game
async function playAndClaimGame(chatId, authen) {
  activeGames[chatId] = true; // Mark the game as active
  for (let i = 0; i < play; i++) {
    if (!activeGames[chatId]) {
      bot.sendMessage(chatId, 'Game disconnected. Stopping the game...');
      return; // Exit the loop if disconnected
    }

    bot.sendMessage(chatId, ` - ${i}. Start Play game...`);
    const _points = Math.floor(Math.random() * (120 - 80 + 1)) + 110;

    const headers = {
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      authorization: authen,
      origin: 'https://telegram.blum.codes',
      priority: 'u=1, i',
      'sec-ch-ua':
        '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128", "Microsoft Edge WebView2";v="128"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
    };
    delete headers['content-type'];

    const response = await fetch(
      'https://game-domain.blum.codes/api/v1/game/play',
      {
        method: 'POST',
        headers: headers,
      }
    );
    const responseData = await response.json();
    const gameid = responseData.gameId;
    bot.sendMessage(chatId, ` - GameId: ${gameid}`);

    const _sleep = Math.floor(Math.random() * 11 + 50) * 1000;
    bot.sendMessage(chatId, ` - sleep: ${_sleep / 1000}s`);
    await sleep(_sleep);

    headers['content-type'] = 'application/json';
    delete headers['content-length'];

    const claim = await fetch(
      'https://game-domain.blum.codes/api/v1/game/claim',
      {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          gameId: gameid,
          points: _points,
        }),
      }
    );
    const claimText = await claim.text();
    bot.sendMessage(chatId, ` - Play status: ${claimText}. Points: ${_points}`);

    const _sleep2 = Math.floor(Math.random() * 6 + 15) * 1000;
    bot.sendMessage(chatId, ` - sleep: ${_sleep2 / 1000}s`);
    await sleep(_sleep2);
  }
  bot.sendMessage(chatId, ' - [ DONE ALL ] ');
  activeGames[chatId] = false; // Mark the game as completed
}

// Handle the /start command and display buttons
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Connect', callback_data: 'connect' }],
        [{ text: 'Disconnect', callback_data: 'disconnect' }],
        [{ text: 'Help', callback_data: 'help' }],
      ],
    },
  };

  bot.sendMessage(chatId, 'Welcome! Choose an option:', options);
});

// Handle button clicks
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;

  if (query.data === 'connect') {
    bot.sendMessage(chatId, 'Please enter your Blum referral link:');
    bot.once('message', async (msg) => {
      const referralLink = msg.text.trim();
      
      // Fetch token using referral link
      const token = await getTokenFromReferral(referralLink);

      if (!token) {
        bot.sendMessage(chatId, 'Failed to retrieve token. Please check your referral link and try again.');
        return;
      }

      userTokens[chatId] = token;
      bot.sendMessage(chatId, 'Token received! Starting the play and claim process...');
      playAndClaimGame(chatId, token);
    });
  } else if (query.data === 'disconnect') {
    activeGames[chatId] = false; // Set active game to false to stop the loop
    bot.sendMessage(chatId, 'Disconnected from Blum account. Game stopped.');
  } else if (query.data === 'help') {
    bot.sendMessage(chatId, 'FAQ: To get a Blum access token, use a referral link provided by Blum.');
  }
});
