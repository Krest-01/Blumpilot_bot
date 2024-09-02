import TelegramBot from 'node-telegram-bot-api';
import fetch from 'node-fetch';

const botToken = "6301224962:AAH0xlCXPsxeUpBAaN8vJqiDhwOO7b-C9Yw"; // Replace with your Telegram Bot Token
const bot = new TelegramBot(botToken, { polling: true });

// Map to store user tokens, using chat IDs as keys
const userTokens = {};

// Sleep function
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to get the number of available games
async function getAvailableGameCount(authen) {
  try {
    const response = await fetch('https://game-domain.blum.codes/api/v1/game/available', { // Replace with the correct endpoint
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'authorization': authen,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve available games: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.availableGamesCount || 0; // Adjust based on the actual API response structure
  } catch (error) {
    console.error('Error fetching available games:', error);
    return 0;
  }
}

// Main function to play and claim all available games
async function playAndClaimGame(chatId, authen) {
  const gameCount = await getAvailableGameCount(authen);
  bot.sendMessage(chatId, ` - Found ${gameCount} games to play.`);

  for (let i = 0; i < gameCount; i++) {
    bot.sendMessage(chatId, ` - ${i + 1}. Start Play game...`);
    const _points = Math.floor(Math.random() * (120 - 80 + 1)) + 110;

    const headers = {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
      'authorization': authen,
      'origin': 'https://telegram.blum.codes',
      'priority': 'u=1, i',
      'sec-ch-ua': '"Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128", "Microsoft Edge WebView2";v="128"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0'
    };
    delete headers["content-type"];

    const response = await fetch('https://game-domain.blum.codes/api/v1/game/play', {
      method: 'POST',
      headers: headers,
    });
    const responseData = await response.json();
    const gameid = responseData.gameId;
    bot.sendMessage(chatId, ` - GameId: ${gameid}`);

    const _sleep = Math.floor(Math.random() * 11 + 50) * 1000;
    bot.sendMessage(chatId, ` - sleep: ${_sleep / 1000}s`);
    await sleep(_sleep);

    headers["content-type"] = 'application/json';
    delete headers["content-length"];

    const claim = await fetch('https://game-domain.blum.codes/api/v1/game/claim', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        'gameId': gameid,
        'points': _points
      })
    });
    const claimText = await claim.text();
    bot.sendMessage(chatId, ` - Play status: ${claimText}. Points: ${_points}`);

    const _sleep2 = Math.floor(Math.random() * 6 + 15) * 1000;
    bot.sendMessage(chatId, ` - sleep: ${_sleep2 / 1000}s`);
    await sleep(_sleep2);
  }
  bot.sendMessage(chatId, " - [ DONE ALL ] ");
}

// Start command to show inline keyboard with Connect, Disconnect, and Help buttons
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          { text: 'Connect', callback_data: 'connect' },
          { text: 'Disconnect', callback_data: 'disconnect' }
        ],
        [
          { text: 'Help', callback_data: 'help' }
        ]
      ]
    }
  };
  bot.sendMessage(chatId, 'Welcome! Choose an option:', options);
});

// Handle button clicks
bot.on('callback_query', (query) => {
  const chatId = query.message.chat.id;
  const action = query.data;

  if (action === 'connect') {
    bot.sendMessage(chatId, 'Please enter your Blum access token to connect:');
    
    bot.once('message', (msg) => {
      const token = msg.text.trim();
      
      if (!token || token.length < 10) {
        bot.sendMessage(chatId, 'Invalid token format. Please try again.');
        return;
      }

      userTokens[chatId] = token;
      bot.sendMessage(chatId, 'Token received! Starting the play and claim process...');
      playAndClaimGame(chatId, token);
    });
  } else if (action === 'disconnect') {
    if (userTokens[chatId]) {
      delete userTokens[chatId];
      bot.sendMessage(chatId, 'Disconnected. All connections have been cancelled.');
    } else {
      bot.sendMessage(chatId, 'You are not connected.');
    }
  } else if (action === 'help') {
    bot.sendMessage(chatId, `
      FAQ:
      - **How to get a Blum access token?**
  
        Go to : https://desktop.telegram.org

        - Install

        - Click "Settings".

        - Click "Advanced".

        - Enable auto update.

        - Click "Experimental settings".

        - Enable web view inspecting.

        - Start the Blum bot.

        - Right-click on the mouse and select "Inspect Element".
        
        - Click "Network".

        - Click "Balance".

        - Copy the Authorization token.
    `);
  }
});
