import telebot

# Твой токен от BotFather
TOKEN = '8001893058:AAFn3l_qFeFjUqIMbdlo-s24nDWW1NnJmNs'
bot = telebot.TeleBot(TOKEN)

@bot.message_handler(commands=['start'])
def start(m):
    bot.send_message(m.chat.id, "<b>ΣΩ-PRIME: CLOUD-ACTIVE</b>\nЯ работаю 24/7. Используй /draw [текст] для фото.", parse_mode='HTML')

@bot.message_handler(commands=['draw'])
def draw(m):
    prompt = m.text.replace('/draw', '').strip().replace(' ', '%20')
    if not prompt:
        bot.reply_to(m, "Напиши, что нарисовать.")
        return
    image_url = f"https://image.pollinations.ai{prompt}"
    bot.send_message(m.chat.id, f"🎨 <b>Результат:</b>\n{image_url}", parse_mode='HTML')

@bot.message_handler(func=lambda message: True)
def any_msg(m):
    bot.reply_to(m, "Система на связи. Жду /draw")

bot.polling(none_stop=True)
