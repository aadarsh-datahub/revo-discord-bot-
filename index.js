require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const Groq = require('groq-sdk');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

client.once('clientReady', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check bot ping'),

    new SlashCommandBuilder()
      .setName('ai')
      .setDescription('Talk with Revo AI')
      .addStringOption(option =>
        option
          .setName('message')
          .setDescription('Ask something')
          .setRequired(true)
      )
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Commands Loaded');
  } catch (err) {
    console.error(err);
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'ping') {
    return interaction.reply('🏓 Pong!');
  }

  if (interaction.commandName === 'ai') {
    await interaction.deferReply();

    const userMessage = interaction.options.getString('message');

    try {
      const result = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are Revo AI, a cool smart Discord assistant. Reply in Hinglish when user uses Hinglish. Keep replies short, friendly, and helpful.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      });

      const response = result.choices[0]?.message?.content || 'No response';

      await interaction.editReply(
        response.length > 2000 ? response.slice(0, 1990) : response
      );

    } catch (err) {
      console.error(err);

      await interaction.editReply(
        '❌ AI error. Groq API key ya model check karo.'
      );
    }
  }
});

client.login(process.env.TOKEN);
